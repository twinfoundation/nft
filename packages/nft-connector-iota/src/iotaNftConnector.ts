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
import type { IVaultConnector } from "@gtsc/vault-models";
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
	type TransactionPayload
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
	 * Runtime name for the class.
	 * @internal
	 */
	private static readonly _CLASS_NAME: string = nameof<IotaNftConnector>();

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
	 * @param dependencies The dependencies for the class.
	 * @param dependencies.vaultConnector The vault connector.
	 * @param config The configuration for the connector.
	 */
	constructor(
		dependencies: {
			vaultConnector: IVaultConnector;
		},
		config: IIotaNftConnectorConfig
	) {
		Guards.object(IotaNftConnector._CLASS_NAME, nameof(dependencies), dependencies);
		Guards.object<IVaultConnector>(
			IotaNftConnector._CLASS_NAME,
			nameof(dependencies.vaultConnector),
			dependencies.vaultConnector
		);
		Guards.object<IIotaNftConnectorConfig>(IotaNftConnector._CLASS_NAME, nameof(config), config);
		Guards.object<IIotaNftConnectorConfig["clientOptions"]>(
			IotaNftConnector._CLASS_NAME,
			nameof(config.clientOptions),
			config.clientOptions
		);
		this._vaultConnector = dependencies.vaultConnector;
		this._config = config;
		this._config.vaultMnemonicId ??= IotaNftConnector._DEFAULT_MNEMONIC_SECRET_NAME;
		this._config.vaultSeedId ??= IotaNftConnector._DEFAULT_SEED_SECRET_NAME;
		this._config.coinType ??= IotaNftConnector._DEFAULT_COIN_TYPE;
		this._config.inclusionTimeoutSeconds ??= IotaNftConnector._DEFAULT_INCLUSION_TIMEOUT;
	}

	/**
	 * Mint an NFT.
	 * @param requestContext The context for the request.
	 * @param issuerAddress The issuer address for the NFT, will also be the owner address.
	 * @param tag The tag for the NFT.
	 * @param immutableMetadata The immutable metadata for the NFT.
	 * @param metadata The metadata for the NFT.
	 * @returns The id of the created NFT in urn format.
	 */
	public async mint<T = unknown, U = unknown>(
		requestContext: IRequestContext,
		issuerAddress: string,
		tag: string,
		immutableMetadata?: T,
		metadata?: U
	): Promise<string> {
		Guards.object<IRequestContext>(
			IotaNftConnector._CLASS_NAME,
			nameof(requestContext),
			requestContext
		);
		Guards.stringValue(
			IotaNftConnector._CLASS_NAME,
			nameof(requestContext.tenantId),
			requestContext.tenantId
		);
		Guards.stringValue(
			IotaNftConnector._CLASS_NAME,
			nameof(requestContext.identity),
			requestContext.identity
		);
		Guards.stringValue(IotaNftConnector._CLASS_NAME, nameof(issuerAddress), issuerAddress);
		Guards.stringValue(IotaNftConnector._CLASS_NAME, nameof(tag), tag);

		try {
			const buildParams: NftOutputBuilderParams = {
				nftId: "0x0000000000000000000000000000000000000000000000000000000000000000",
				unlockConditions: [
					new AddressUnlockCondition(new Ed25519Address(Utils.bech32ToHex(issuerAddress)))
				],
				immutableFeatures: [
					new IssuerFeature(new Ed25519Address(Utils.bech32ToHex(issuerAddress)))
				],
				features: [
					new SenderFeature(new Ed25519Address(Utils.bech32ToHex(issuerAddress))),
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
				IotaNftConnector._CLASS_NAME,
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
		Guards.object<IRequestContext>(
			IotaNftConnector._CLASS_NAME,
			nameof(requestContext),
			requestContext
		);
		Guards.stringValue(
			IotaNftConnector._CLASS_NAME,
			nameof(requestContext.tenantId),
			requestContext.tenantId
		);
		Guards.stringValue(
			IotaNftConnector._CLASS_NAME,
			nameof(requestContext.identity),
			requestContext.identity
		);
		Guards.stringValue(IotaNftConnector._CLASS_NAME, nameof(id), id);

		Urn.guard(IotaNftConnector._CLASS_NAME, nameof(id), id);
		const urnParsed = Urn.fromValidString(id);

		if (urnParsed.namespaceIdentifier() !== IotaNftConnector.NAMESPACE) {
			throw new GeneralError(IotaNftConnector._CLASS_NAME, "namespaceMismatch", {
				namespace: IotaNftConnector.NAMESPACE,
				id
			});
		}

		try {
			const client = new Client(this._config.clientOptions);
			const nftParts = urnParsed.namespaceSpecific().split(":");

			const hrp = nftParts[0];
			const nftId = nftParts[1];
			Guards.stringHexLength(IotaNftConnector._CLASS_NAME, "nftId", nftId, 64, true);

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
				IotaNftConnector._CLASS_NAME,
				"resolvingFailed",
				undefined,
				this.extractPayloadError(error)
			);
		}
	}

	/**
	 * Burn an NFT.
	 * @param requestContext The context for the request.
	 * @param ownerAddress The owner address for the NFT to return the funds to.
	 * @param id The id of the NFT to burn in urn format.
	 * @returns Nothing.
	 */
	public async burn(
		requestContext: IRequestContext,
		ownerAddress: string,
		id: string
	): Promise<void> {
		Guards.object<IRequestContext>(
			IotaNftConnector._CLASS_NAME,
			nameof(requestContext),
			requestContext
		);
		Guards.stringValue(
			IotaNftConnector._CLASS_NAME,
			nameof(requestContext.tenantId),
			requestContext.tenantId
		);
		Guards.stringValue(
			IotaNftConnector._CLASS_NAME,
			nameof(requestContext.identity),
			requestContext.identity
		);
		Guards.stringValue(IotaNftConnector._CLASS_NAME, nameof(ownerAddress), ownerAddress);

		Urn.guard(IotaNftConnector._CLASS_NAME, nameof(id), id);
		const urnParsed = Urn.fromValidString(id);

		if (urnParsed.namespaceIdentifier() !== IotaNftConnector.NAMESPACE) {
			throw new GeneralError(IotaNftConnector._CLASS_NAME, "namespaceMismatch", {
				namespace: IotaNftConnector.NAMESPACE,
				id
			});
		}

		try {
			const client = new Client(this._config.clientOptions);
			const nftParts = urnParsed.namespaceSpecific().split(":");

			const nftId = nftParts[1];
			Guards.stringHexLength(IotaNftConnector._CLASS_NAME, "nftId", nftId, 64, true);

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
						new AddressUnlockCondition(new Ed25519Address(Utils.bech32ToHex(ownerAddress)))
					])
				]
			});
		} catch (error) {
			throw new GeneralError(
				IotaNftConnector._CLASS_NAME,
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
	 * @param recipientAddress The recipient address of the NFT.
	 * @returns Nothing.
	 */
	public async transfer(
		requestContext: IRequestContext,
		id: string,
		recipientAddress: string
	): Promise<void> {
		Guards.object<IRequestContext>(
			IotaNftConnector._CLASS_NAME,
			nameof(requestContext),
			requestContext
		);
		Guards.stringValue(
			IotaNftConnector._CLASS_NAME,
			nameof(requestContext.tenantId),
			requestContext.tenantId
		);
		Guards.stringValue(
			IotaNftConnector._CLASS_NAME,
			nameof(requestContext.identity),
			requestContext.identity
		);
		Urn.guard(IotaNftConnector._CLASS_NAME, nameof(id), id);
		Guards.stringValue(IotaNftConnector._CLASS_NAME, nameof(recipientAddress), recipientAddress);

		const urnParsed = Urn.fromValidString(id);
		if (urnParsed.namespaceIdentifier() !== IotaNftConnector.NAMESPACE) {
			throw new GeneralError(IotaNftConnector._CLASS_NAME, "namespaceMismatch", {
				namespace: IotaNftConnector.NAMESPACE,
				id
			});
		}

		try {
			const client = new Client(this._config.clientOptions);

			const nftParts = urnParsed.namespaceSpecific().split(":");
			const nftId = nftParts[1];
			Guards.stringHexLength(IotaNftConnector._CLASS_NAME, "nftId", nftId, 64, true);

			const nftOutputId = await client.nftOutputId(nftId);
			const nftOutputResponse = await client.getOutput(nftOutputId);
			const nftOutput = nftOutputResponse.output as NftOutput;

			const recipientNftOutput = await client.buildNftOutput({
				nftId,
				unlockConditions: [
					new AddressUnlockCondition(new Ed25519Address(Utils.bech32ToHex(recipientAddress)))
				],
				immutableFeatures: nftOutput.immutableFeatures,
				features: nftOutput.features
			});

			await this.prepareAndPostTransaction(requestContext, client, {
				inputs: [
					new UTXOInput(
						nftOutputResponse.metadata.transactionId,
						nftOutputResponse.metadata.outputIndex
					)
				],
				outputs: [recipientNftOutput]
			});
		} catch (error) {
			throw new GeneralError(
				IotaNftConnector._CLASS_NAME,
				"transferFailed",
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
				IotaNftConnector._CLASS_NAME,
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
			return {
				name: "IOTA",
				message: obj.payload?.error
			};
		}

		return BaseError.fromError(error);
	}
}
