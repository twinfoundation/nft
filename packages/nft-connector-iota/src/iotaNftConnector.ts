// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import {
	AddressUnlockCondition,
	BasicOutput,
	Client,
	Ed25519Address,
	FeatureType,
	IssuerFeature,
	MetadataFeature,
	SenderFeature,
	TagFeature,
	UTXOInput,
	UnlockConditionType,
	Utils,
	type Feature,
	type NftOutput,
	type NftOutputBuilderParams,
	type TransactionPayload
} from "@iota/sdk-wasm/node/lib/index.js";
import { Converter, GeneralError, Guards, Is, ObjectHelper, Urn } from "@twin.org/core";
import { Iota } from "@twin.org/dlt-iota";
import { nameof } from "@twin.org/nameof";
import type { INftConnector } from "@twin.org/nft-models";
import { VaultConnectorFactory, type IVaultConnector } from "@twin.org/vault-models";
import { type IWalletConnector, WalletConnectorFactory } from "@twin.org/wallet-models";
import type { IIotaNftConnectorConfig } from "./models/IIotaNftConnectorConfig";
import type { IIotaNftConnectorConstructorOptions } from "./models/IIotaNftConnectorConstructorOptions";

/**
 * Class for performing NFT operations on IOTA.
 */
export class IotaNftConnector implements INftConnector {
	/**
	 * The namespace supported by the nft connector.
	 */
	public static readonly NAMESPACE: string = "iota";

	/**
	 * Runtime name for the class.
	 */
	public readonly CLASS_NAME: string = nameof<IotaNftConnector>();

	/**
	 * Connector for vault operations.
	 * @internal
	 */
	private readonly _vaultConnector: IVaultConnector;

	/**
	 * Connector for wallet operations.
	 * @internal
	 */
	private readonly _walletConnector: IWalletConnector;

	/**
	 * The configuration for the connector.
	 * @internal
	 */
	private readonly _config: IIotaNftConnectorConfig;

	/**
	 * Create a new instance of IotaNftConnector.
	 * @param options The options for the connector.
	 */
	constructor(options: IIotaNftConnectorConstructorOptions) {
		Guards.object(this.CLASS_NAME, nameof(options), options);
		Guards.object<IIotaNftConnectorConfig>(this.CLASS_NAME, nameof(options.config), options.config);
		Guards.object<IIotaNftConnectorConfig["clientOptions"]>(
			this.CLASS_NAME,
			nameof(options.config.clientOptions),
			options.config.clientOptions
		);
		this._vaultConnector = VaultConnectorFactory.get(options.vaultConnectorType ?? "vault");
		this._walletConnector = WalletConnectorFactory.get(options.walletConnectorType ?? "wallet");
		this._config = options.config;
		Iota.populateConfig(this._config);
	}

	/**
	 * Mint an NFT.
	 * @param controllerIdentity The identity of the user to access the vault keys.
	 * @param tag The tag for the NFT.
	 * @param immutableMetadata The immutable metadata for the NFT.
	 * @param metadata The metadata for the NFT.
	 * @returns The id of the created NFT in urn format.
	 */
	public async mint<T = unknown, U = unknown>(
		controllerIdentity: string,
		tag: string,
		immutableMetadata?: T,
		metadata?: U
	): Promise<string> {
		Guards.stringValue(this.CLASS_NAME, nameof(controllerIdentity), controllerIdentity);
		Guards.stringValue(this.CLASS_NAME, nameof(tag), tag);

		try {
			const addressIndex = this._config.walletAddressIndex ?? 0;
			const addresses = await this._walletConnector.getAddresses(
				controllerIdentity,
				0,
				addressIndex,
				1
			);

			const address = new Ed25519Address(Utils.bech32ToHex(addresses[0]));

			const buildParams: NftOutputBuilderParams = {
				nftId: "0x0000000000000000000000000000000000000000000000000000000000000000",
				unlockConditions: [new AddressUnlockCondition(address)],
				immutableFeatures: [new IssuerFeature(address)],
				features: [new SenderFeature(address), new TagFeature(Converter.utf8ToHex(tag, true))]
			};

			const finalImmutable = (immutableMetadata ?? {}) as T & { issuerIdentity: string };
			const finalMutable = (metadata ?? {}) as U & { ownerIdentity: string };

			finalImmutable.issuerIdentity = controllerIdentity;
			finalMutable.ownerIdentity = controllerIdentity;

			buildParams.features?.push(
				new MetadataFeature(Converter.bytesToHex(ObjectHelper.toBytes(metadata), true))
			);

			buildParams.immutableFeatures?.push(
				new MetadataFeature(Converter.bytesToHex(ObjectHelper.toBytes(immutableMetadata), true))
			);

			const client = new Client(this._config.clientOptions);

			const nftOutput = await client.buildNftOutput(buildParams);

			const blockDetails = await Iota.prepareAndPostTransaction(
				this._config,
				this._vaultConnector,
				controllerIdentity,
				client,
				{
					outputs: [nftOutput]
				}
			);

			const transactionId = Utils.transactionId(blockDetails.block.payload as TransactionPayload);
			const outputId = Utils.computeOutputId(transactionId, 0);
			const nftId = Utils.computeNftId(outputId);

			const hrp = await client.getBech32Hrp();

			return `nft:${new Urn(IotaNftConnector.NAMESPACE, `${hrp}:${nftId}`).toString()}`;
		} catch (error) {
			throw new GeneralError(
				this.CLASS_NAME,
				"mintingFailed",
				undefined,
				Iota.extractPayloadError(error)
			);
		}
	}

	/**
	 * Resolve an NFT.
	 * @param id The id of the NFT to resolve.
	 * @returns The data for the NFT.
	 */
	public async resolve<T = unknown, U = unknown>(
		id: string
	): Promise<{
		issuer: string;
		owner: string;
		tag: string;
		immutableMetadata?: T;
		metadata?: U;
	}> {
		Urn.guard(this.CLASS_NAME, nameof(id), id);
		const urnParsed = Urn.fromValidString(id);

		if (urnParsed.namespaceMethod() !== IotaNftConnector.NAMESPACE) {
			throw new GeneralError(this.CLASS_NAME, "namespaceMismatch", {
				namespace: IotaNftConnector.NAMESPACE,
				id
			});
		}

		try {
			const client = new Client(this._config.clientOptions);
			const nftParts = urnParsed.namespaceSpecificParts(1);

			const nftId = nftParts[1];
			Guards.stringHexLength(this.CLASS_NAME, "nftId", nftId, 64, true);

			const nftOutputId = await client.nftOutputId(nftId);
			const nftOutputResponse = await client.getOutput(nftOutputId);
			const nftOutput = nftOutputResponse.output as NftOutput;

			const immutableFeatures = nftOutput.immutableFeatures?.filter(
				f => f.type === FeatureType.Metadata
			);
			const metadataFeatures = nftOutput.features?.filter(f => f.type === FeatureType.Metadata);
			const tagFeatures = nftOutput.features?.filter(f => f.type === FeatureType.Tag);
			const immutableMetadata = Is.arrayValue(immutableFeatures)
				? Converter.hexToUtf8((immutableFeatures[0] as MetadataFeature).data)
				: "";
			const tag = Is.arrayValue(tagFeatures)
				? Converter.hexToUtf8((tagFeatures[0] as TagFeature).tag)
				: "";
			const metadata = Is.arrayValue(metadataFeatures)
				? Converter.hexToUtf8((metadataFeatures[0] as MetadataFeature).data)
				: "";

			const immutable: T & { issuerIdentity: string } = Is.stringValue(immutableMetadata)
				? JSON.parse(immutableMetadata)
				: {};
			const mutable: U & { ownerIdentity: string } = Is.stringValue(metadata)
				? JSON.parse(metadata)
				: {};

			const issuerIdentity = ObjectHelper.extractProperty<string>(immutable, ["issuerIdentity"]);
			const ownerIdentity = ObjectHelper.extractProperty<string>(mutable, ["ownerIdentity"]);

			return {
				issuer: issuerIdentity ?? "",
				owner: ownerIdentity ?? "",
				tag,
				immutableMetadata: immutable,
				metadata: mutable
			};
		} catch (error) {
			throw new GeneralError(
				this.CLASS_NAME,
				"resolvingFailed",
				undefined,
				Iota.extractPayloadError(error)
			);
		}
	}

	/**
	 * Burn an NFT.
	 * @param controllerIdentity The controller of the NFT who can make changes.
	 * @param id The id of the NFT to burn in urn format.
	 * @returns Nothing.
	 */
	public async burn(controllerIdentity: string, id: string): Promise<void> {
		Guards.stringValue(this.CLASS_NAME, nameof(controllerIdentity), controllerIdentity);
		Urn.guard(this.CLASS_NAME, nameof(id), id);

		const urnParsed = Urn.fromValidString(id);
		if (urnParsed.namespaceMethod() !== IotaNftConnector.NAMESPACE) {
			throw new GeneralError(this.CLASS_NAME, "namespaceMismatch", {
				namespace: IotaNftConnector.NAMESPACE,
				id
			});
		}

		try {
			const client = new Client(this._config.clientOptions);
			const nftParts = urnParsed.namespaceSpecificParts(1);

			const hrp = nftParts[0];
			const nftId = nftParts[1];
			Guards.stringHexLength(this.CLASS_NAME, "nftId", nftId, 64, true);

			const nftOutputId = await client.nftOutputId(nftId);
			const nftOutputResponse = await client.getOutput(nftOutputId);

			const nftOutput = nftOutputResponse.output as NftOutput;

			const unlockConditions = nftOutput.unlockConditions?.filter(
				f => f.type === UnlockConditionType.Address
			);
			const currentOwner = Is.arrayValue(unlockConditions)
				? ((unlockConditions[0] as AddressUnlockCondition).address as Ed25519Address).pubKeyHash
				: "";
			const currentOwnerAddressBech32 = Utils.hexToBech32(currentOwner, hrp);

			await Iota.prepareAndPostTransaction(
				this._config,
				this._vaultConnector,
				controllerIdentity,
				client,
				{
					burn: {
						nfts: [nftId]
					},
					inputs: [
						new UTXOInput(
							nftOutputResponse.metadata.transactionId,
							nftOutputResponse.metadata.outputIndex
						)
					],
					outputs: [
						new BasicOutput(nftOutputResponse.output.getAmount(), [
							new AddressUnlockCondition(
								new Ed25519Address(Utils.bech32ToHex(currentOwnerAddressBech32))
							)
						])
					]
				}
			);
		} catch (error) {
			throw new GeneralError(
				this.CLASS_NAME,
				"burningFailed",
				undefined,
				Iota.extractPayloadError(error)
			);
		}
	}

	/**
	 * Transfer an NFT.
	 * @param controllerIdentity The controller of the NFT who can make changes.
	 * @param id The id of the NFT to transfer in urn format.
	 * @param recipientIdentity The recipient identity for the NFT.
	 * @param recipientAddress The recipient address for the NFT.
	 * @param metadata Optional mutable data to include during the transfer.
	 * @returns Nothing.
	 */
	public async transfer<U = unknown>(
		controllerIdentity: string,
		id: string,
		recipientIdentity: string,
		recipientAddress: string,
		metadata?: U
	): Promise<void> {
		Guards.stringValue(this.CLASS_NAME, nameof(controllerIdentity), controllerIdentity);
		Urn.guard(this.CLASS_NAME, nameof(id), id);
		Guards.stringValue(this.CLASS_NAME, nameof(recipientIdentity), recipientIdentity);
		Guards.stringValue(this.CLASS_NAME, nameof(recipientAddress), recipientAddress);

		const urnParsed = Urn.fromValidString(id);
		if (urnParsed.namespaceMethod() !== IotaNftConnector.NAMESPACE) {
			throw new GeneralError(this.CLASS_NAME, "namespaceMismatch", {
				namespace: IotaNftConnector.NAMESPACE,
				id
			});
		}

		try {
			const client = new Client(this._config.clientOptions);

			const nftParts = urnParsed.namespaceSpecificParts(1);
			const hrp = nftParts[0];
			const nftId = nftParts[1];
			Guards.stringHexLength(this.CLASS_NAME, "nftId", nftId, 64, true);

			const nftOutputId = await client.nftOutputId(nftId);
			const nftOutputResponse = await client.getOutput(nftOutputId);
			const nftOutput = nftOutputResponse.output as NftOutput;

			const unlockConditions = nftOutput.unlockConditions?.filter(
				f => f.type === UnlockConditionType.Address
			);
			const currentOwner = Is.arrayValue(unlockConditions)
				? ((unlockConditions[0] as AddressUnlockCondition).address as Ed25519Address).pubKeyHash
				: "";
			const currentOwnerAddressBech32 = Utils.hexToBech32(currentOwner, hrp);

			const mutableFeatures: Feature[] = [new SenderFeature(new Ed25519Address(currentOwner))];

			if (Is.object(metadata)) {
				// We have new metadata so add the owner identity to the metadata.
				const mutable = metadata as U & { ownerIdentity: string };
				mutable.ownerIdentity = recipientIdentity;

				mutableFeatures.push(
					new MetadataFeature(Converter.bytesToHex(ObjectHelper.toBytes(mutable), true))
				);
			} else {
				// No new metadata so we need to keep the existing metadata and replace the owner identity.
				const metadataFeatures = nftOutput.features?.filter(f => f.type === FeatureType.Metadata);
				const currentMetadata = Is.arrayValue(metadataFeatures)
					? Converter.hexToUtf8((metadataFeatures[0] as MetadataFeature).data)
					: "";

				const mutable: U & { ownerIdentity: string } = Is.stringValue(currentMetadata)
					? JSON.parse(currentMetadata)
					: {};
				mutable.ownerIdentity = recipientIdentity;

				mutableFeatures.push(
					new MetadataFeature(Converter.bytesToHex(ObjectHelper.toBytes(mutable), true))
				);
			}

			const recipientNftOutput = await client.buildNftOutput({
				nftId,
				unlockConditions: [
					new AddressUnlockCondition(new Ed25519Address(Utils.bech32ToHex(recipientAddress)))
				],
				immutableFeatures: nftOutput.immutableFeatures,
				features: mutableFeatures
			});

			// We need additional inputs in case the mutable data size has grown.
			const additionalInputs = await client.findInputs(
				[currentOwnerAddressBech32],
				recipientNftOutput.getAmount()
			);

			await Iota.prepareAndPostTransaction(
				this._config,
				this._vaultConnector,
				controllerIdentity,
				client,
				{
					inputs: [
						new UTXOInput(
							nftOutputResponse.metadata.transactionId,
							nftOutputResponse.metadata.outputIndex
						),
						...additionalInputs
					],
					outputs: [recipientNftOutput]
				}
			);
		} catch (error) {
			throw new GeneralError(
				this.CLASS_NAME,
				"transferFailed",
				undefined,
				Iota.extractPayloadError(error)
			);
		}
	}

	/**
	 * Update the data of the NFT.
	 * @param controllerIdentity The controller of the NFT who can make changes.
	 * @param id The id of the NFT to update in urn format.
	 * @param metadata The mutable data to update.
	 * @returns Nothing.
	 */
	public async update<U = unknown>(
		controllerIdentity: string,
		id: string,
		metadata: U
	): Promise<void> {
		Guards.stringValue(this.CLASS_NAME, nameof(controllerIdentity), controllerIdentity);
		Urn.guard(this.CLASS_NAME, nameof(id), id);
		Guards.object<U>(this.CLASS_NAME, nameof(metadata), metadata);

		const urnParsed = Urn.fromValidString(id);
		if (urnParsed.namespaceMethod() !== IotaNftConnector.NAMESPACE) {
			throw new GeneralError(this.CLASS_NAME, "namespaceMismatch", {
				namespace: IotaNftConnector.NAMESPACE,
				id
			});
		}

		try {
			const client = new Client(this._config.clientOptions);

			const nftParts = urnParsed.namespaceSpecificParts(1);
			const hrp = nftParts[0];
			const nftId = nftParts[1];
			Guards.stringHexLength(this.CLASS_NAME, "nftId", nftId, 64, true);

			const nftOutputId = await client.nftOutputId(nftId);
			const nftOutputResponse = await client.getOutput(nftOutputId);
			const nftOutput = nftOutputResponse.output as NftOutput;

			const unlockConditions = nftOutput.unlockConditions?.filter(
				f => f.type === UnlockConditionType.Address
			);
			const currentOwner = Is.arrayValue(unlockConditions)
				? ((unlockConditions[0] as AddressUnlockCondition).address as Ed25519Address).pubKeyHash
				: "";
			const currentOwnerAddressBech32 = Utils.hexToBech32(currentOwner, hrp);

			const metadataFeatures = nftOutput.features?.filter(f => f.type === FeatureType.Metadata);
			const currentMetadata = Is.arrayValue(metadataFeatures)
				? Converter.hexToUtf8((metadataFeatures[0] as MetadataFeature).data)
				: "";

			const currentMutable: U & { ownerIdentity: string } = Is.stringValue(currentMetadata)
				? JSON.parse(currentMetadata)
				: {};

			// We have new metadata so add the owner identity to the metadata.
			const mutable = metadata as U & { ownerIdentity: string };
			mutable.ownerIdentity = currentMutable.ownerIdentity;

			const mutableFeatures: Feature[] = [
				new SenderFeature(new Ed25519Address(currentOwner)),
				new MetadataFeature(Converter.bytesToHex(ObjectHelper.toBytes(mutable), true))
			];

			const recipientNftOutput = await client.buildNftOutput({
				nftId,
				unlockConditions: nftOutput.unlockConditions,
				immutableFeatures: nftOutput.immutableFeatures,
				features: mutableFeatures
			});

			// We need additional inputs in case the mutable data size has grown.
			const additionalInputs = await client.findInputs(
				[currentOwnerAddressBech32],
				recipientNftOutput.getAmount()
			);

			await Iota.prepareAndPostTransaction(
				this._config,
				this._vaultConnector,
				controllerIdentity,
				client,
				{
					inputs: [
						new UTXOInput(
							nftOutputResponse.metadata.transactionId,
							nftOutputResponse.metadata.outputIndex
						),
						...additionalInputs
					],
					outputs: [recipientNftOutput]
				}
			);
		} catch (error) {
			throw new GeneralError(
				this.CLASS_NAME,
				"updateFailed",
				undefined,
				Iota.extractPayloadError(error)
			);
		}
	}
}
