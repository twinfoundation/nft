// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IotaClient } from "@iota/iota-sdk/client";
import { Transaction } from "@iota/iota-sdk/transactions";
import { BaseError, Converter, GeneralError, Guards, Is, StringHelper, Urn } from "@twin.org/core";
import { IotaRebased, type IIotaDryRun } from "@twin.org/dlt-iota-rebased";
import { type ILoggingConnector, LoggingConnectorFactory } from "@twin.org/logging-models";
import { nameof } from "@twin.org/nameof";
import type { INftConnector } from "@twin.org/nft-models";
import { VaultConnectorFactory, type IVaultConnector } from "@twin.org/vault-models";
import compiledModulesJson from "./contracts/compiledModules/compiled-modules.json";
import { IotaRebasedNftUtils } from "./iotaRebasedNftUtils";
import type { IIotaRebasedNftConnectorConfig } from "./models/IIotaRebasedNftConnectorConfig";
import type { IIotaRebasedNftConnectorConstructorOptions } from "./models/IIotaRebasedNftConnectorConstructorOptions";
import type { IIotaRebasedNftMetadata } from "./models/IIotaRebasedNftMetadata";
import type { INftFields } from "./models/INftFields";

/**
 * Class for performing NFT operations on IOTA Rebased.
 */
export class IotaRebasedNftConnector implements INftConnector {
	/**
	 * The namespace supported by the nft connector.
	 */
	public static readonly NAMESPACE: string = "iota-rebased";

	/**
	 * Runtime name for the class.
	 */
	public readonly CLASS_NAME: string = nameof<IotaRebasedNftConnector>();

	/**
	 * Gas budget for transactions.
	 * @internal
	 */
	private readonly _gasBudget: number;

	/**
	 * Connector for vault operations.
	 * @internal
	 */
	private readonly _vaultConnector: IVaultConnector;

	/**
	 * The configuration for the connector.
	 * @internal
	 */
	private readonly _config: IIotaRebasedNftConnectorConfig;

	/**
	 * The IOTA Rebased client.
	 * @internal
	 */
	private readonly _client: IotaClient;

	/**
	 * The name of the contract to use.
	 * @internal
	 */
	private readonly _contractName: string;

	/**
	 * The package ID of the deployed NFT Move module.
	 * @internal
	 */
	private _packageId?: string;

	/**
	 * The logging connector.
	 * @internal
	 */
	private readonly _logging?: ILoggingConnector;

	/**
	 * Create a new instance of IotaRebasedNftConnector.
	 * @param options The options for the connector.
	 */
	constructor(options: IIotaRebasedNftConnectorConstructorOptions) {
		Guards.object(this.CLASS_NAME, nameof(options), options);
		Guards.object<IIotaRebasedNftConnectorConfig>(
			this.CLASS_NAME,
			nameof(options.config),
			options.config
		);
		Guards.object<IIotaRebasedNftConnectorConfig["clientOptions"]>(
			this.CLASS_NAME,
			nameof(options.config.clientOptions),
			options.config.clientOptions
		);
		this._vaultConnector = VaultConnectorFactory.get(options.vaultConnectorType ?? "vault");

		this._logging = LoggingConnectorFactory.getIfExists(options?.loggingConnectorType ?? "logging");

		this._config = options.config;

		this._contractName = this._config.contractName ?? "nft";
		Guards.stringValue(this.CLASS_NAME, nameof(this._contractName), this._contractName);

		this._gasBudget = this._config.gasBudget ?? 1_000_000_000;
		Guards.number(this.CLASS_NAME, nameof(this._gasBudget), this._gasBudget);
		if (this._gasBudget <= 0) {
			throw new GeneralError(this.CLASS_NAME, "invalidGasBudget", {
				gasBudget: this._gasBudget
			});
		}

		IotaRebased.populateConfig(this._config);
		this._client = IotaRebased.createClient(this._config);
	}

	/**
	 * Bootstrap the NFT contract.
	 * @param nodeIdentity The identity of the node.
	 * @param nodeLoggingConnectorType The node logging connector type, defaults to "node-logging".
	 * @param componentState The component state.
	 * @returns void.
	 */
	public async start(
		nodeIdentity: string,
		nodeLoggingConnectorType?: string,
		componentState?: { [id: string]: unknown }
	): Promise<void> {
		const nodeLogging = LoggingConnectorFactory.getIfExists(
			nodeLoggingConnectorType ?? "node-logging"
		);

		try {
			const contractData =
				compiledModulesJson[this._contractName as keyof typeof compiledModulesJson];

			if (!contractData) {
				throw new GeneralError(this.CLASS_NAME, "contractDataNotFound", {
					contractName: this._contractName
				});
			}

			// Convert base64 package(s) to bytes
			let compiledModules: number[][];

			if (Is.arrayValue<string>(contractData.package)) {
				compiledModules = contractData.package.map((pkg: string) =>
					Array.from(Converter.base64ToBytes(pkg))
				);
			} else {
				compiledModules = [Array.from(Converter.base64ToBytes(contractData.package))];
			}

			if (Is.stringValue(componentState?.packageId)) {
				this._packageId = componentState.packageId;

				// Check if package exists on the network
				const packageExists = await IotaRebased.packageExistsOnNetwork(
					this._client,
					this._packageId
				);
				if (packageExists) {
					await nodeLogging?.log({
						level: "info",
						source: this.CLASS_NAME,
						ts: Date.now(),
						message: "contractAlreadyDeployed",
						data: {
							network: this._config.network,
							nodeIdentity,
							packageId: this._packageId
						}
					});
				}
			}

			// Package does not exist, proceed to deploy
			await nodeLogging?.log({
				level: "info",
				source: this.CLASS_NAME,
				ts: Date.now(),
				message: "contractDeploymentStarted",
				data: {
					network: this._config.network,
					nodeIdentity
				}
			});

			const txb = new Transaction();
			txb.setGasBudget(this._gasBudget);

			// Publish the compiled modules
			const [upgradeCap] = txb.publish({
				modules: compiledModules,
				dependencies: ["0x1", "0x2"]
			});

			const controllerAddress = await this.getPackageControllerAddress(nodeIdentity);

			// Transfer the upgrade capability to the controller
			txb.transferObjects([upgradeCap], txb.pure.address(controllerAddress));

			// Dry run the transaction if cost logging is enabled to get the gas and storage costs
			if (this._config.enableCostLogging) {
				await this.dryRunTransaction(txb, nodeIdentity, "deploy");
			}

			const result = await IotaRebased.prepareAndPostNftTransaction(
				this._config,
				this._vaultConnector,
				nodeIdentity,
				this._client,
				{
					owner: controllerAddress,
					transaction: txb,
					showEffects: true,
					showEvents: true,
					showObjectChanges: true
				}
			);

			if (result.effects?.status?.status !== "success") {
				throw new GeneralError(this.CLASS_NAME, "deployTransactionFailed", {
					error: result.effects?.status?.error
				});
			}

			// Find the package object (owner field will be Immutable)
			const packageObject = result.effects?.created?.find(obj => obj.owner === "Immutable");

			const packageId = packageObject?.reference?.objectId;
			if (!packageId) {
				throw new GeneralError(this.CLASS_NAME, "packageIdNotFound", {
					packageId
				});
			}

			this._packageId = packageId;

			if (componentState) {
				componentState.packageId = this._packageId;
			}

			await nodeLogging?.log({
				level: "info",
				source: this.CLASS_NAME,
				ts: Date.now(),
				message: "contractDeploymentCompleted",
				data: {
					packageId: this._packageId
				}
			});
		} catch (error) {
			await nodeLogging?.log({
				level: "error",
				source: this.CLASS_NAME,
				ts: Date.now(),
				message: "startFailed",
				error: BaseError.fromError(error),
				data: {
					network: this._config.network,
					nodeIdentity
				}
			});

			throw error;
		}
	}

	/**
	 * Mint an NFT.
	 * @param controller The identity of the user to access the vault keys.
	 * @param issuer The issuer for the NFT, will also be the initial owner.
	 * @param tag The tag for the NFT.
	 * @param immutableMetadata The immutable metadata for the NFT.
	 * @param metadata The metadata for the NFT.
	 * @returns The id of the created NFT in urn format.
	 */
	public async mint<T = unknown, U = unknown>(
		controller: string,
		issuer: string,
		tag: string,
		immutableMetadata?: T,
		metadata?: U
	): Promise<string> {
		this.ensureStarted();
		Guards.stringValue(this.CLASS_NAME, nameof(controller), controller);
		Guards.stringValue(this.CLASS_NAME, nameof(issuer), issuer);
		Guards.stringValue(this.CLASS_NAME, nameof(tag), tag);

		try {
			const txb = new Transaction();
			txb.setGasBudget(this._gasBudget);

			// Convert mutable metadata to string
			const metadataString = metadata ? JSON.stringify(metadata) : "";

			let name = "";
			let description = "";
			let uri = "";

			if (Is.object(immutableMetadata)) {
				const meta = immutableMetadata as unknown as IIotaRebasedNftMetadata;
				name = meta.name;
				description = meta.description;
				uri = meta.uri;
			}

			const packageId = this._packageId;
			const moduleName = this.getModuleName();

			// Call the mint function from our Move contract
			txb.moveCall({
				target: `${packageId}::${moduleName}::mint`,
				arguments: [
					txb.pure.string(name),
					txb.pure.string(description),
					txb.pure.string(uri),
					txb.pure.string(tag),
					txb.pure.address(issuer),
					txb.pure.string(metadataString)
				]
			});

			// Dry run the transaction if cost logging is enabled to get the gas and storage costs
			if (this._config.enableCostLogging) {
				await this.dryRunTransaction(txb, controller, "mint");
			}

			const result = await IotaRebased.prepareAndPostNftTransaction(
				this._config,
				this._vaultConnector,
				controller,
				this._client,
				{
					owner: issuer,
					transaction: txb,
					showEffects: true,
					showEvents: true,
					showObjectChanges: true
				}
			);

			if (!result.createdObject?.objectId) {
				throw new GeneralError(this.CLASS_NAME, "failedToGetNftId", undefined);
			}

			const urn = new Urn(
				"nft",
				`${IotaRebasedNftConnector.NAMESPACE}:${this._config.network}:${this._packageId}:${result.createdObject.objectId}`
			);

			return urn.toString();
		} catch (error) {
			throw new GeneralError(
				this.CLASS_NAME,
				"mintingFailed",
				undefined,
				IotaRebased.extractPayloadError(error)
			);
		}
	}

	/**
	 * Resolve an NFT to get its details.
	 * @param nftId The id of the NFT to resolve.
	 * @returns The NFT details.
	 */
	public async resolve<T = unknown, U = unknown>(
		nftId: string
	): Promise<{
		issuer: string;
		owner: string;
		tag: string;
		immutableMetadata?: T;
		metadata?: U;
	}> {
		Guards.stringValue(this.CLASS_NAME, nameof(nftId), nftId);

		try {
			const objectId = IotaRebasedNftUtils.nftIdToObjectId(nftId);
			const object = await this._client.getObject({
				id: objectId,
				options: {
					showContent: true,
					showType: true,
					showOwner: true
				}
			});

			if (!object.data?.content) {
				throw new GeneralError(this.CLASS_NAME, "nftNotFound", {
					nftId
				});
			}

			// Because object.data.content is of type IotaParsedData
			const parsedData = object.data.content as unknown as {
				fields: INftFields;
			};

			const content = parsedData.fields;

			// Add owner information to the returned object
			const owner = object.data.owner;
			let ownerAddress: string | null = null;

			if (Is.object(owner)) {
				if ("AddressOwner" in owner) {
					ownerAddress = owner.AddressOwner;
				} else if ("ObjectOwner" in owner) {
					ownerAddress = owner.ObjectOwner;
				}
				// Shared ownership is handled as null
			}

			// Extract immutable metadata
			const immutableMetadata = {
				name: content.name,
				description: content.description,
				uri: content.uri
			} as T;

			// Parse mutable metadata if it's JSON
			let metadata: U | undefined;
			if (content.metadata) {
				try {
					metadata = JSON.parse(content.metadata) as U;
				} catch {}
			}

			return {
				issuer: content.issuer?.toString(),
				owner: ownerAddress ?? "",
				tag: content.tag?.toString(),
				immutableMetadata,
				metadata
			};
		} catch (error) {
			throw new GeneralError(
				this.CLASS_NAME,
				"resolvingFailed",
				undefined,
				IotaRebased.extractPayloadError(error)
			);
		}
	}

	/**
	 * Burn an NFT.
	 * @param controller The controller of the NFT who can make changes.
	 * @param id The id of the NFT to burn in urn format.
	 * @returns void.
	 */
	public async burn(controller: string, id: string): Promise<void> {
		Guards.stringValue(this.CLASS_NAME, nameof(controller), controller);
		Urn.guard(this.CLASS_NAME, nameof(id), id);

		const urnParsed = Urn.fromValidString(id);
		if (urnParsed.namespaceMethod() !== IotaRebasedNftConnector.NAMESPACE) {
			throw new GeneralError(this.CLASS_NAME, "namespaceMismatch", {
				namespace: IotaRebasedNftConnector.NAMESPACE,
				id
			});
		}

		try {
			const txb = new Transaction();
			txb.setGasBudget(this._gasBudget);

			const objectId = IotaRebasedNftUtils.nftIdToObjectId(id);
			const packageId = IotaRebasedNftUtils.nftIdToPackageId(id);
			const moduleName = this.getModuleName();

			txb.moveCall({
				target: `${packageId}::${moduleName}::burn`,
				arguments: [txb.object(objectId)]
			});

			const details = await this.resolve(id);
			// Dry run the transaction if cost logging is enabled to get the gas and storage costs
			if (this._config.enableCostLogging) {
				await this.dryRunTransaction(txb, controller, "burn");
			}

			const result = await IotaRebased.prepareAndPostNftTransaction(
				this._config,
				this._vaultConnector,
				controller,
				this._client,
				{
					owner: details.owner,
					transaction: txb,
					showEffects: true,
					showEvents: true,
					showObjectChanges: true
				}
			);

			if (result.effects?.status?.status !== "success") {
				throw new GeneralError(this.CLASS_NAME, "burningFailed", {
					error: result.effects?.status?.error
				});
			}
		} catch (error) {
			throw new GeneralError(
				this.CLASS_NAME,
				"burningFailed",
				undefined,
				IotaRebased.extractPayloadError(error)
			);
		}
	}

	/**
	 * Transfer an NFT to a new owner.
	 * @param controller The identity of the user to access the vault keys.
	 * @param nftId The id of the NFT to transfer.
	 * @param recipient The address to transfer the NFT to.
	 * @param metadata Optional metadata to update during transfer.
	 * @returns void.
	 */
	public async transfer<T = unknown>(
		controller: string,
		nftId: string,
		recipient: string,
		metadata?: T
	): Promise<void> {
		Guards.stringValue(this.CLASS_NAME, nameof(controller), controller);
		Guards.stringValue(this.CLASS_NAME, nameof(nftId), nftId);
		Guards.stringValue(this.CLASS_NAME, nameof(recipient), recipient);
		if (!Is.undefined(metadata)) {
			Guards.object(this.CLASS_NAME, nameof(metadata), metadata);
		}

		const urnParsed = Urn.fromValidString(nftId);
		if (urnParsed.namespaceMethod() !== IotaRebasedNftConnector.NAMESPACE) {
			throw new GeneralError(this.CLASS_NAME, "namespaceMismatch", {
				namespace: IotaRebasedNftConnector.NAMESPACE,
				id: nftId
			});
		}

		try {
			const txb = new Transaction();
			txb.setGasBudget(this._gasBudget);

			const objectId = IotaRebasedNftUtils.nftIdToObjectId(nftId);
			const packageId = IotaRebasedNftUtils.nftIdToPackageId(nftId);
			const moduleName = this.getModuleName();

			const object = await this._client.getObject({
				id: objectId,
				options: {
					showContent: true,
					showType: true,
					showOwner: true
				}
			});

			const details = await this.resolve(nftId);
			if (!object.data?.content) {
				throw new GeneralError(this.CLASS_NAME, "nftNotFound", {
					nftId
				});
			}

			if (!Is.undefined(metadata)) {
				// If metadata is provided, use transfer_with_metadata
				const metadataString = JSON.stringify(metadata);
				txb.moveCall({
					target: `${packageId}::${moduleName}::transfer_with_metadata`,
					arguments: [
						txb.object(objectId),
						txb.pure.address(recipient),
						txb.pure.string(metadataString)
					]
				});
			} else {
				txb.transferObjects([txb.object(objectId)], txb.pure.address(recipient));
			}

			// Dry run the transaction if cost logging is enabled to get the gas and storage costs
			if (this._config.enableCostLogging) {
				await this.dryRunTransaction(txb, controller, "transfer");
			}

			const result = await IotaRebased.prepareAndPostNftTransaction(
				this._config,
				this._vaultConnector,
				controller,
				this._client,
				{
					owner: details.owner,
					transaction: txb,
					showEffects: true,
					showEvents: true,
					showObjectChanges: true
				}
			);

			if (result.effects?.status?.status !== "success") {
				throw new GeneralError(this.CLASS_NAME, "transferFailed", {
					error: result.effects?.status?.error
				});
			}
		} catch (error) {
			throw new GeneralError(
				this.CLASS_NAME,
				"transferFailed",
				undefined,
				IotaRebased.extractPayloadError(error)
			);
		}
	}

	/**
	 * Update the mutable data of an NFT.
	 * @param controller The controller of the NFT who can make changes.
	 * @param id The id of the NFT to update in urn format.
	 * @param metadata The new metadata for the NFT.
	 * @returns void.
	 */
	public async update<T = unknown>(controller: string, id: string, metadata: T): Promise<void> {
		this.ensureStarted();
		Guards.stringValue(this.CLASS_NAME, nameof(controller), controller);
		Urn.guard(this.CLASS_NAME, nameof(id), id);
		Guards.object(this.CLASS_NAME, nameof(metadata), metadata);

		const urnParsed = Urn.fromValidString(id);
		if (urnParsed.namespaceMethod() !== IotaRebasedNftConnector.NAMESPACE) {
			throw new GeneralError(this.CLASS_NAME, "namespaceMismatch", {
				namespace: IotaRebasedNftConnector.NAMESPACE,
				id
			});
		}

		try {
			const txb = new Transaction();
			txb.setGasBudget(this._gasBudget);

			const objectId = IotaRebasedNftUtils.nftIdToObjectId(id);

			// Convert metadata to string for storage
			const metadataString = JSON.stringify(metadata);

			const packageId = this._packageId;
			const moduleName = this.getModuleName();

			txb.moveCall({
				target: `${packageId}::${moduleName}::update_metadata`,
				arguments: [txb.object(objectId), txb.pure.string(metadataString)]
			});

			const details = await this.resolve(id);
			// Dry run the transaction if cost logging is enabled to get the gas and storage costs
			if (this._config.enableCostLogging) {
				await this.dryRunTransaction(txb, controller, "update");
			}

			const result = await IotaRebased.prepareAndPostNftTransaction(
				this._config,
				this._vaultConnector,
				controller,
				this._client,
				{
					owner: details.owner,
					transaction: txb,
					showEffects: true,
					showEvents: true,
					showObjectChanges: true
				}
			);

			if (result.effects?.status?.status !== "success") {
				throw new GeneralError(this.CLASS_NAME, "updateFailed", {
					error: result.effects?.status?.error
				});
			}
		} catch (error) {
			throw new GeneralError(
				this.CLASS_NAME,
				"updateFailed",
				undefined,
				IotaRebased.extractPayloadError(error)
			);
		}
	}

	/**
	 * Get the package controller's address.
	 * @param identity The identity of the user to access the vault keys.
	 * @returns The controller's address.
	 */
	private async getPackageControllerAddress(identity: string): Promise<string> {
		const seed = await IotaRebased.getSeed(this._config, this._vaultConnector, identity);
		const walletAddressIndex = this._config.packageControllerAddressIndex ?? 0;
		const addresses = IotaRebased.getAddresses(
			seed,
			this._config.coinType ?? IotaRebased.DEFAULT_COIN_TYPE,
			0,
			walletAddressIndex,
			1,
			false
		);

		return addresses[0];
	}

	/**
	 * Ensure that the connector is bootstrapped.
	 * @throws GeneralError if the connector is not started.
	 */
	private ensureStarted(): void {
		if (!this._packageId) {
			throw new GeneralError(this.CLASS_NAME, "connectorNotStarted", {
				packageId: this._packageId
			});
		}
	}

	/**
	 * Get the module name based on the contract name.
	 * @returns The module name in snake_case.
	 * @internal
	 */
	private getModuleName(): string {
		return StringHelper.snakeCase(this._contractName);
	}

	/**
	 * Dry run a transaction.
	 * @param txb The transaction to dry run.
	 * @param controller The controller of the transaction.
	 * @param operation The operation to log.
	 * @returns void.
	 */
	private async dryRunTransaction(
		txb: Transaction,
		controller: string,
		operation: string
	): Promise<IIotaDryRun> {
		const controllerAddress = await this.getPackageControllerAddress(controller);
		const dryRunResponse = await IotaRebased.dryRunTransaction(
			this._client,
			this._logging,
			this.CLASS_NAME,
			txb,
			controllerAddress,
			operation
		);

		return dryRunResponse;
	}
}
