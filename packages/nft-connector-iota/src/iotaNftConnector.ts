// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import {
	BaseError,
	Converter,
	GeneralError,
	Guards,
	Is,
	ObjectHelper,
	Urn,
	type IError
} from "@gtsc/core";
import { Bip39 } from "@gtsc/crypto";
import { nameof } from "@gtsc/nameof";
import type { INftConnector } from "@gtsc/nft-models";
import type { IRequestContext } from "@gtsc/services";
import { VaultConnectorFactory, type IVaultConnector } from "@gtsc/vault-models";
import {
	AddressUnlockCondition,
	BasicOutput,
	Client,
	CoinType,
	Ed25519Address,
	FeatureType,
	IssuerFeature,
	MetadataFeature,
	SenderFeature,
	TagFeature,
	UTXOInput,
	UnlockConditionType,
	Utils,
	type Block,
	type IBuildBlockOptions,
	type NftOutput,
	type NftOutputBuilderParams,
	type TransactionPayload,
	type Feature
} from "@iota/sdk-wasm/node/lib/index.js";
import type { IIotaNftConnectorConfig } from "./models/IIotaNftConnectorConfig";

/**
 * Class for performing NFT operations on IOTA.
 */
export class IotaNftConnector implements INftConnector {
	/**
	 * The namespace supported by the wallet connector.
	 */
	public static NAMESPACE: string = "iota-nft";

	/**
	 * Default name for the seed secret.
	 */
	private static readonly _DEFAULT_SEED_SECRET_NAME: string = "seed";

	/**
	 * Default name for the mnemonic secret.
	 * @internal
	 */
	private static readonly _DEFAULT_MNEMONIC_SECRET_NAME: string = "mnemonic";

	/**
	 * The default length of time to wait for the inclusion of a transaction in seconds.
	 * @internal
	 */
	private static readonly _DEFAULT_INCLUSION_TIMEOUT: number = 60;

	/**
	 * Default coin type.
	 * @internal
	 */
	private static readonly _DEFAULT_COIN_TYPE: number = CoinType.IOTA;

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
	 * The configuration for the connector.
	 * @internal
	 */
	private readonly _config: IIotaNftConnectorConfig;

	/**
	 * Create a new instance of IotaNftConnector.
	 * @param options The options for the connector.
	 * @param options.vaultConnectorType The type of the vault connector, defaults to "vault".
	 * @param options.config The configuration for the connector.
	 */
	constructor(options: { vaultConnectorType?: string; config: IIotaNftConnectorConfig }) {
		Guards.object(this.CLASS_NAME, nameof(options), options);
		Guards.object<IIotaNftConnectorConfig>(this.CLASS_NAME, nameof(options.config), options.config);
		Guards.object<IIotaNftConnectorConfig["clientOptions"]>(
			this.CLASS_NAME,
			nameof(options.config.clientOptions),
			options.config.clientOptions
		);
		this._vaultConnector = VaultConnectorFactory.get(options.vaultConnectorType ?? "vault");
		this._config = options.config;
		this._config.vaultMnemonicId ??= IotaNftConnector._DEFAULT_MNEMONIC_SECRET_NAME;
		this._config.vaultSeedId ??= IotaNftConnector._DEFAULT_SEED_SECRET_NAME;
		this._config.coinType ??= IotaNftConnector._DEFAULT_COIN_TYPE;
		this._config.inclusionTimeoutSeconds ??= IotaNftConnector._DEFAULT_INCLUSION_TIMEOUT;
	}

	/**
	 * Mint an NFT.
	 * @param requestContext The context for the request.
	 * @param issuer The issuer for the NFT, will also be the initial owner.
	 * @param tag The tag for the NFT.
	 * @param immutableMetadata The immutable metadata for the NFT.
	 * @param metadata The metadata for the NFT.
	 * @returns The id of the created NFT in urn format.
	 */
	public async mint<T = unknown, U = unknown>(
		requestContext: IRequestContext,
		issuer: string,
		tag: string,
		immutableMetadata?: T,
		metadata?: U
	): Promise<string> {
		Guards.object<IRequestContext>(this.CLASS_NAME, nameof(requestContext), requestContext);
		Guards.stringValue(this.CLASS_NAME, nameof(requestContext.tenantId), requestContext.tenantId);
		Guards.stringValue(this.CLASS_NAME, nameof(requestContext.identity), requestContext.identity);
		Guards.stringValue(this.CLASS_NAME, nameof(issuer), issuer);
		Guards.stringValue(this.CLASS_NAME, nameof(tag), tag);

		try {
			const buildParams: NftOutputBuilderParams = {
				nftId: "0x0000000000000000000000000000000000000000000000000000000000000000",
				unlockConditions: [
					new AddressUnlockCondition(new Ed25519Address(Utils.bech32ToHex(issuer)))
				],
				immutableFeatures: [new IssuerFeature(new Ed25519Address(Utils.bech32ToHex(issuer)))],
				features: [
					new SenderFeature(new Ed25519Address(Utils.bech32ToHex(issuer))),
					new TagFeature(Converter.utf8ToHex(tag, true))
				]
			};

			if (Is.object(metadata)) {
				buildParams.features?.push(
					new MetadataFeature(Converter.bytesToHex(ObjectHelper.toBytes(metadata), true))
				);
			}

			if (Is.object(immutableMetadata)) {
				buildParams.immutableFeatures?.push(
					new MetadataFeature(Converter.bytesToHex(ObjectHelper.toBytes(immutableMetadata), true))
				);
			}

			const client = new Client(this._config.clientOptions);

			const nftOutput = await client.buildNftOutput(buildParams);

			const blockDetails = await this.prepareAndPostTransaction(requestContext, client, {
				outputs: [nftOutput]
			});

			const transactionId = Utils.transactionId(blockDetails.block.payload as TransactionPayload);
			const outputId = Utils.computeOutputId(transactionId, 0);
			const nftId = Utils.computeNftId(outputId);

			const hrp = await client.getBech32Hrp();

			return new Urn(IotaNftConnector.NAMESPACE, `${hrp}:${nftId}`).toString();
		} catch (error) {
			throw new GeneralError(
				this.CLASS_NAME,
				"mintingFailed",
				undefined,
				this.extractPayloadError(error)
			);
		}
	}

	/**
	 * Resolve an NFT.
	 * @param requestContext The context for the request.
	 * @param id The id of the NFT to resolve.
	 * @returns The data for the NFT.
	 */
	public async resolve<T = unknown, U = unknown>(
		requestContext: IRequestContext,
		id: string
	): Promise<{
		issuer: string;
		owner: string;
		tag: string;
		immutableMetadata?: T;
		metadata?: U;
	}> {
		Guards.object<IRequestContext>(this.CLASS_NAME, nameof(requestContext), requestContext);
		Guards.stringValue(this.CLASS_NAME, nameof(requestContext.tenantId), requestContext.tenantId);
		Guards.stringValue(this.CLASS_NAME, nameof(requestContext.identity), requestContext.identity);
		Guards.stringValue(this.CLASS_NAME, nameof(id), id);

		Urn.guard(this.CLASS_NAME, nameof(id), id);
		const urnParsed = Urn.fromValidString(id);

		if (urnParsed.namespaceIdentifier() !== IotaNftConnector.NAMESPACE) {
			throw new GeneralError(this.CLASS_NAME, "namespaceMismatch", {
				namespace: IotaNftConnector.NAMESPACE,
				id
			});
		}

		try {
			const client = new Client(this._config.clientOptions);
			const nftParts = urnParsed.namespaceSpecific().split(":");

			const hrp = nftParts[0];
			const nftId = nftParts[1];
			Guards.stringHexLength(this.CLASS_NAME, "nftId", nftId, 64, true);

			const nftOutputId = await client.nftOutputId(nftId);
			const nftOutputResponse = await client.getOutput(nftOutputId);
			const nftOutput = nftOutputResponse.output as NftOutput;

			const unlockConditions = nftOutput.unlockConditions?.filter(
				f => f.type === UnlockConditionType.Address
			);
			const issuerFeatures = nftOutput.immutableFeatures?.filter(
				f => f.type === FeatureType.Issuer
			);
			const immutableFeatures = nftOutput.immutableFeatures?.filter(
				f => f.type === FeatureType.Metadata
			);
			const metadataFeatures = nftOutput.features?.filter(f => f.type === FeatureType.Metadata);
			const tagFeatures = nftOutput.features?.filter(f => f.type === FeatureType.Tag);

			const owner = Is.arrayValue(unlockConditions)
				? ((unlockConditions[0] as AddressUnlockCondition).address as Ed25519Address).pubKeyHash
				: "";
			const issuer = Is.arrayValue(issuerFeatures)
				? ((issuerFeatures[0] as IssuerFeature).address as Ed25519Address).pubKeyHash
				: "";
			const immutableMetadata = Is.arrayValue(immutableFeatures)
				? Converter.hexToUtf8((immutableFeatures[0] as MetadataFeature).data)
				: "";
			const tag = Is.arrayValue(tagFeatures)
				? Converter.hexToUtf8((tagFeatures[0] as TagFeature).tag)
				: "";
			const metadata = Is.arrayValue(metadataFeatures)
				? Converter.hexToUtf8((metadataFeatures[0] as MetadataFeature).data)
				: "";

			return {
				issuer: Utils.hexToBech32(issuer, hrp),
				owner: Utils.hexToBech32(owner, hrp),
				tag,
				immutableMetadata: Is.stringValue(immutableMetadata)
					? JSON.parse(immutableMetadata)
					: undefined,
				metadata: Is.stringValue(metadata) ? JSON.parse(metadata) : undefined
			};
		} catch (error) {
			throw new GeneralError(
				this.CLASS_NAME,
				"resolvingFailed",
				undefined,
				this.extractPayloadError(error)
			);
		}
	}

	/**
	 * Burn an NFT.
	 * @param requestContext The context for the request.
	 * @param owner The owner for the NFT to return the funds to.
	 * @param id The id of the NFT to burn in urn format.
	 * @returns Nothing.
	 */
	public async burn(requestContext: IRequestContext, owner: string, id: string): Promise<void> {
		Guards.object<IRequestContext>(this.CLASS_NAME, nameof(requestContext), requestContext);
		Guards.stringValue(this.CLASS_NAME, nameof(requestContext.tenantId), requestContext.tenantId);
		Guards.stringValue(this.CLASS_NAME, nameof(requestContext.identity), requestContext.identity);
		Guards.stringValue(this.CLASS_NAME, nameof(owner), owner);

		Urn.guard(this.CLASS_NAME, nameof(id), id);
		const urnParsed = Urn.fromValidString(id);

		if (urnParsed.namespaceIdentifier() !== IotaNftConnector.NAMESPACE) {
			throw new GeneralError(this.CLASS_NAME, "namespaceMismatch", {
				namespace: IotaNftConnector.NAMESPACE,
				id
			});
		}

		try {
			const client = new Client(this._config.clientOptions);
			const nftParts = urnParsed.namespaceSpecific().split(":");

			const nftId = nftParts[1];
			Guards.stringHexLength(this.CLASS_NAME, "nftId", nftId, 64, true);

			const nftOutputId = await client.nftOutputId(nftId);
			const nftOutputResponse = await client.getOutput(nftOutputId);

			await this.prepareAndPostTransaction(requestContext, client, {
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
						new AddressUnlockCondition(new Ed25519Address(Utils.bech32ToHex(owner)))
					])
				]
			});
		} catch (error) {
			throw new GeneralError(
				this.CLASS_NAME,
				"burningFailed",
				undefined,
				this.extractPayloadError(error)
			);
		}
	}

	/**
	 * Transfer an NFT.
	 * @param requestContext The context for the request.
	 * @param id The id of the NFT to transfer in urn format.
	 * @param recipient The recipient of the NFT.
	 * @param metadata Optional mutable data to include during the transfer.
	 * @returns Nothing.
	 */
	public async transfer<T>(
		requestContext: IRequestContext,
		id: string,
		recipient: string,
		metadata?: T
	): Promise<void> {
		Guards.object<IRequestContext>(this.CLASS_NAME, nameof(requestContext), requestContext);
		Guards.stringValue(this.CLASS_NAME, nameof(requestContext.tenantId), requestContext.tenantId);
		Guards.stringValue(this.CLASS_NAME, nameof(requestContext.identity), requestContext.identity);
		Urn.guard(this.CLASS_NAME, nameof(id), id);
		Guards.stringValue(this.CLASS_NAME, nameof(recipient), recipient);

		const urnParsed = Urn.fromValidString(id);
		if (urnParsed.namespaceIdentifier() !== IotaNftConnector.NAMESPACE) {
			throw new GeneralError(this.CLASS_NAME, "namespaceMismatch", {
				namespace: IotaNftConnector.NAMESPACE,
				id
			});
		}

		try {
			const client = new Client(this._config.clientOptions);

			const nftParts = urnParsed.namespaceSpecific().split(":");
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
				mutableFeatures.push(
					new MetadataFeature(Converter.bytesToHex(ObjectHelper.toBytes(metadata), true))
				);
			} else {
				const currentMetadata = mutableFeatures.filter(m => m.type === FeatureType.Metadata);
				mutableFeatures.push(...currentMetadata);
			}

			const recipientNftOutput = await client.buildNftOutput({
				nftId,
				unlockConditions: [
					new AddressUnlockCondition(new Ed25519Address(Utils.bech32ToHex(recipient)))
				],
				immutableFeatures: nftOutput.immutableFeatures,
				features: mutableFeatures
			});

			// We need additional inputs in case the mutable data size has grown.
			const additionalInputs = await client.findInputs(
				[currentOwnerAddressBech32],
				recipientNftOutput.getAmount()
			);

			await this.prepareAndPostTransaction(requestContext, client, {
				inputs: [
					new UTXOInput(
						nftOutputResponse.metadata.transactionId,
						nftOutputResponse.metadata.outputIndex
					),
					...additionalInputs
				],
				outputs: [recipientNftOutput]
			});
		} catch (error) {
			throw new GeneralError(
				this.CLASS_NAME,
				"transferFailed",
				undefined,
				this.extractPayloadError(error)
			);
		}
	}

	/**
	 * Update the mutable data of the NFT.
	 * @param requestContext The context for the request.
	 * @param id The id of the NFT to update in urn format.
	 * @param metadata The mutable data to update.
	 * @returns Nothing.
	 */
	public async update<T>(requestContext: IRequestContext, id: string, metadata: T): Promise<void> {
		Guards.object<IRequestContext>(this.CLASS_NAME, nameof(requestContext), requestContext);
		Guards.stringValue(this.CLASS_NAME, nameof(requestContext.tenantId), requestContext.tenantId);
		Guards.stringValue(this.CLASS_NAME, nameof(requestContext.identity), requestContext.identity);
		Urn.guard(this.CLASS_NAME, nameof(id), id);
		Guards.object<T>(this.CLASS_NAME, nameof(metadata), metadata);

		const urnParsed = Urn.fromValidString(id);
		if (urnParsed.namespaceIdentifier() !== IotaNftConnector.NAMESPACE) {
			throw new GeneralError(this.CLASS_NAME, "namespaceMismatch", {
				namespace: IotaNftConnector.NAMESPACE,
				id
			});
		}

		try {
			const client = new Client(this._config.clientOptions);

			const nftParts = urnParsed.namespaceSpecific().split(":");
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

			const mutableFeatures: Feature[] = [
				new SenderFeature(new Ed25519Address(currentOwner)),
				new MetadataFeature(Converter.bytesToHex(ObjectHelper.toBytes(metadata), true))
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

			await this.prepareAndPostTransaction(requestContext, client, {
				inputs: [
					new UTXOInput(
						nftOutputResponse.metadata.transactionId,
						nftOutputResponse.metadata.outputIndex
					),
					...additionalInputs
				],
				outputs: [recipientNftOutput]
			});
		} catch (error) {
			throw new GeneralError(
				this.CLASS_NAME,
				"updateFailed",
				undefined,
				this.extractPayloadError(error)
			);
		}
	}

	/**
	 * Prepare a transaction for sending, post and wait for inclusion.
	 * @param requestContext The context for the request.
	 * @param client The client to use.
	 * @param options The options for the transaction.
	 * @returns The block id and block.
	 * @internal
	 */
	private async prepareAndPostTransaction(
		requestContext: IRequestContext,
		client: Client,
		options: IBuildBlockOptions
	): Promise<{ blockId: string; block: Block }> {
		const seed = await this.getSeed(requestContext);
		const secretManager = { hexSeed: Converter.bytesToHex(seed, true) };

		const prepared = await client.prepareTransaction(secretManager, {
			coinType: this._config.coinType ?? IotaNftConnector._DEFAULT_COIN_TYPE,
			...options
		});

		const signed = await client.signTransaction(secretManager, prepared);

		const blockIdAndBlock = await client.postBlockPayload(signed);

		try {
			const timeoutSeconds =
				this._config.inclusionTimeoutSeconds ?? IotaNftConnector._DEFAULT_INCLUSION_TIMEOUT;

			await client.retryUntilIncluded(blockIdAndBlock[0], 2, Math.ceil(timeoutSeconds / 2));
		} catch (error) {
			throw new GeneralError(
				this.CLASS_NAME,
				"inclusionFailed",
				undefined,
				this.extractPayloadError(error)
			);
		}

		return {
			blockId: blockIdAndBlock[0],
			block: blockIdAndBlock[1]
		};
	}

	/**
	 * Get the seed from the vault.
	 * @param requestContext The context for the request.
	 * @returns The seed.
	 * @internal
	 */
	private async getSeed(requestContext: IRequestContext): Promise<Uint8Array> {
		try {
			const seedBase64 = await this._vaultConnector.getSecret<string>(
				requestContext,
				this._config.vaultSeedId ?? IotaNftConnector._DEFAULT_SEED_SECRET_NAME
			);
			return Converter.base64ToBytes(seedBase64);
		} catch {}

		const mnemonic = await this._vaultConnector.getSecret<string>(
			requestContext,
			this._config.vaultMnemonicId ?? IotaNftConnector._DEFAULT_MNEMONIC_SECRET_NAME
		);

		return Bip39.mnemonicToSeed(mnemonic);
	}

	/**
	 * Extract error from SDK payload.
	 * @param error The error to extract.
	 * @returns The extracted error.
	 */
	private extractPayloadError(error: unknown): IError {
		if (Is.json(error)) {
			const obj = JSON.parse(error);
			let message = obj.payload?.error;
			if (message === "no input with matching ed25519 address provided") {
				message = "There were insufficient funds to complete the operation";
			}
			return {
				name: "IOTA",
				message
			};
		}

		return BaseError.fromError(error);
	}
}
