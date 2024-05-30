// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Converter, GeneralError, Guards, Is, ObjectHelper, Urn } from "@gtsc/core";
import { nameof } from "@gtsc/nameof";
import type { INftConnector } from "@gtsc/nft-models";
import type { IRequestContext } from "@gtsc/services";
import type { IVaultConnector } from "@gtsc/vault-models";
import type { IWalletConnector } from "@gtsc/wallet-models";
import {
	AddressUnlockCondition,
	BasicOutput,
	Client,
	CoinType,
	Ed25519Address,
	IssuerFeature,
	MetadataFeature,
	SenderFeature,
	TagFeature,
	UTXOInput,
	Utils,
	type Block,
	type IBuildBlockOptions,
	type NftOutput,
	type NftOutputBuilderParams,
	type TransactionPayload
} from "@iota/sdk-wasm/node";
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
	 * Default name for the mnemonic secret.
	 * @internal
	 */
	private static readonly _DEFAULT_MNEMONIC_SECRET_NAME: string = "wallet-mnemonic";

	/**
	 * The default length of time to wait for the inclusion of a transaction in seconds.
	 * @internal
	 */
	private static readonly _DEFAULT_INCLUSION_TIMEOUT: number = 60;

	/**
	 * The default index to use for storing nfts.
	 * @internal
	 */
	private static readonly _DEFAULT_ADDRESS_INDEX = 2;

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
	 * The IOTA Wallet client.
	 * @internal
	 */
	private _client?: Client;

	/**
	 * Create a new instance of IotaNftConnector.
	 * @param dependencies The dependencies for the class.
	 * @param dependencies.vaultConnector The vault connector.
	 * @param dependencies.walletConnector The wallet connector.
	 * @param config The configuration for the connector.
	 */
	constructor(
		dependencies: {
			vaultConnector: IVaultConnector;
			walletConnector: IWalletConnector;
		},
		config: IIotaNftConnectorConfig
	) {
		Guards.object(IotaNftConnector._CLASS_NAME, nameof(dependencies), dependencies);
		Guards.object<IVaultConnector>(
			IotaNftConnector._CLASS_NAME,
			nameof(dependencies.vaultConnector),
			dependencies.vaultConnector
		);
		Guards.object<IWalletConnector>(
			IotaNftConnector._CLASS_NAME,
			nameof(dependencies.walletConnector),
			dependencies.walletConnector
		);
		Guards.object<IIotaNftConnectorConfig>(IotaNftConnector._CLASS_NAME, nameof(config), config);
		Guards.object<IIotaNftConnectorConfig["clientOptions"]>(
			IotaNftConnector._CLASS_NAME,
			nameof(config.clientOptions),
			config.clientOptions
		);
		this._vaultConnector = dependencies.vaultConnector;
		this._walletConnector = dependencies.walletConnector;
		this._config = config;
		this._config.walletMnemonicId ??= IotaNftConnector._DEFAULT_MNEMONIC_SECRET_NAME;
		this._config.addressIndex ??= IotaNftConnector._DEFAULT_ADDRESS_INDEX;
		this._config.coinType ??= IotaNftConnector._DEFAULT_COIN_TYPE;
		this._config.inclusionTimeoutSeconds ??= IotaNftConnector._DEFAULT_INCLUSION_TIMEOUT;
	}

	/**
	 * Mint an NFT.
	 * @param requestContext The context for the request.
	 * @param tag The tag for the NFT.
	 * @param immutableMetadata The immutable metadata for the NFT.
	 * @param metadata The metadata for the NFT.
	 * @returns The id of the created NFT in urn format.
	 */
	public async mint<T = unknown, U = unknown>(
		requestContext: IRequestContext,
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
		Guards.stringValue(IotaNftConnector._CLASS_NAME, nameof(tag), tag);

		try {
			const nftAddressIndex = this._config.addressIndex ?? IotaNftConnector._DEFAULT_ADDRESS_INDEX;
			const addresses = await this._walletConnector.getAddresses(
				requestContext,
				nftAddressIndex,
				1
			);

			const nftAddress = addresses[0];

			const buildParams: NftOutputBuilderParams = {
				nftId: "0x0000000000000000000000000000000000000000000000000000000000000000",
				unlockConditions: [
					new AddressUnlockCondition(new Ed25519Address(Utils.bech32ToHex(nftAddress)))
				],
				immutableFeatures: [new IssuerFeature(new Ed25519Address(Utils.bech32ToHex(nftAddress)))],
				features: [
					new SenderFeature(new Ed25519Address(Utils.bech32ToHex(nftAddress))),
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

			const mnemonic = await this._vaultConnector.getSecret<string>(
				requestContext,
				this._config.walletMnemonicId ?? IotaNftConnector._DEFAULT_MNEMONIC_SECRET_NAME
			);

			const client = await this.createClient();
			const nftOutput = await client.buildNftOutput(buildParams);

			const blockDetails = await this.prepareAndPostTransaction(client, mnemonic, {
				outputs: [nftOutput]
			});

			const transactionId = Utils.transactionId(blockDetails.block.payload as TransactionPayload);
			const outputId = Utils.computeOutputId(transactionId, 0);
			const nftId = Utils.computeNftId(outputId);
			return new Urn(IotaNftConnector.NAMESPACE, nftId).toString();
		} catch (error) {
			throw new GeneralError(IotaNftConnector._CLASS_NAME, "mintingFailed", undefined, error);
		}
	}

	/**
	 * Burn an NFT.
	 * @param requestContext The context for the request.
	 * @param id The id of the NFT to burn in urn format.
	 * @returns Nothing.
	 */
	public async burn(requestContext: IRequestContext, id: string): Promise<void> {
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
		const urnParsed = Urn.fromValidString(id);

		if (urnParsed.namespaceIdentifier() !== IotaNftConnector.NAMESPACE) {
			throw new GeneralError(IotaNftConnector._CLASS_NAME, "namespaceMismatch", {
				namespace: IotaNftConnector.NAMESPACE,
				id
			});
		}

		try {
			const client = await this.createClient();

			const mnemonic = await this._vaultConnector.getSecret<string>(
				requestContext,
				this._config.walletMnemonicId ?? IotaNftConnector._DEFAULT_MNEMONIC_SECRET_NAME
			);

			const nftAddressIndex = this._config.addressIndex ?? IotaNftConnector._DEFAULT_ADDRESS_INDEX;
			const addresses = await this._walletConnector.getAddresses(
				requestContext,
				nftAddressIndex,
				1
			);

			const nftAddress = addresses[0];

			const nftOutputId = await client.nftOutputId(urnParsed.namespaceSpecific());
			const nftOutputResponse = await client.getOutput(nftOutputId);

			await this.prepareAndPostTransaction(client, mnemonic, {
				burn: {
					nfts: [urnParsed.namespaceSpecific()]
				},
				inputs: [
					new UTXOInput(
						nftOutputResponse.metadata.transactionId,
						nftOutputResponse.metadata.outputIndex
					)
				],
				outputs: [
					new BasicOutput(nftOutputResponse.output.getAmount(), [
						new AddressUnlockCondition(new Ed25519Address(Utils.bech32ToHex(nftAddress)))
					])
				]
			});
		} catch (error) {
			throw new GeneralError(IotaNftConnector._CLASS_NAME, "burningFailed", undefined, error);
		}
	}

	/**
	 * Transfer an NFT.
	 * @param requestContext The context for the request.
	 * @param id The id of the NFT to transfer in urn format.
	 * @param recipient The recipient identity of the NFT.
	 * @returns Nothing.
	 */
	public async transfer(
		requestContext: IRequestContext,
		id: string,
		recipient: string
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
		Guards.stringValue(IotaNftConnector._CLASS_NAME, nameof(recipient), recipient);

		const urnParsed = Urn.fromValidString(id);
		if (urnParsed.namespaceIdentifier() !== IotaNftConnector.NAMESPACE) {
			throw new GeneralError(IotaNftConnector._CLASS_NAME, "namespaceMismatch", {
				namespace: IotaNftConnector.NAMESPACE,
				id
			});
		}

		try {
			const client = await this.createClient();

			const nftAddressIndex = this._config.addressIndex ?? IotaNftConnector._DEFAULT_ADDRESS_INDEX;
			const recipientAddresses = await this._walletConnector.getAddresses(
				{
					...requestContext,
					identity: recipient
				},
				nftAddressIndex,
				1
			);

			const recipientAddress = recipientAddresses[0];

			const nftOutputId = await client.nftOutputId(urnParsed.namespaceSpecific());
			const nftOutputResponse = await client.getOutput(nftOutputId);
			const nftOutput = nftOutputResponse.output as NftOutput;

			const recipientNftOutput = await client.buildNftOutput({
				nftId: urnParsed.namespaceSpecific(),
				unlockConditions: [
					new AddressUnlockCondition(new Ed25519Address(Utils.bech32ToHex(recipientAddress)))
				],
				immutableFeatures: nftOutput.immutableFeatures,
				features: nftOutput.features
			});

			const mnemonic = await this._vaultConnector.getSecret<string>(
				requestContext,
				this._config.walletMnemonicId ?? IotaNftConnector._DEFAULT_MNEMONIC_SECRET_NAME
			);

			await this.prepareAndPostTransaction(client, mnemonic, {
				inputs: [
					new UTXOInput(
						nftOutputResponse.metadata.transactionId,
						nftOutputResponse.metadata.outputIndex
					)
				],
				outputs: [recipientNftOutput]
			});
		} catch (error) {
			throw new GeneralError(IotaNftConnector._CLASS_NAME, "transferFailed", undefined, error);
		}
	}

	/**
	 * Create a client for the IOTA network.
	 * @returns The client.
	 * @internal
	 */
	private async createClient(): Promise<Client> {
		if (!this._client) {
			this._client = new Client(this._config.clientOptions);
		}
		return this._client;
	}

	/**
	 * Prepare a transaction for sending, post and wait for inclusion.
	 * @param client The client to use.
	 * @param mnemonic The mnemonic to use.
	 * @param options The options for the transaction.
	 * @returns The block id and block.
	 * @internal
	 */
	private async prepareAndPostTransaction(
		client: Client,
		mnemonic: string,
		options: IBuildBlockOptions
	): Promise<{ blockId: string; block: Block }> {
		const prepared = await client.prepareTransaction(
			{ mnemonic },
			{
				coinType: this._config.coinType ?? IotaNftConnector._DEFAULT_COIN_TYPE,
				...options
			}
		);

		const signed = await client.signTransaction({ mnemonic }, prepared);

		const blockIdAndBlock = await client.postBlockPayload(signed);

		try {
			const timeoutSeconds =
				this._config.inclusionTimeoutSeconds ?? IotaNftConnector._DEFAULT_INCLUSION_TIMEOUT;

			await client.retryUntilIncluded(blockIdAndBlock[0], 2, Math.ceil(timeoutSeconds / 2));
		} catch (error) {
			throw new GeneralError(IotaNftConnector._CLASS_NAME, "inclusionFailed", undefined, error);
		}

		return {
			blockId: blockIdAndBlock[0],
			block: blockIdAndBlock[1]
		};
	}
}
