// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Converter, GeneralError, Guards, Is, NotFoundError, RandomHelper, Urn } from "@gtsc/core";
import type { IEntityStorageConnector } from "@gtsc/entity-storage-models";
import { nameof } from "@gtsc/nameof";
import type { INftConnector } from "@gtsc/nft-models";
import type { IRequestContext } from "@gtsc/services";
import { VaultKeyType, type IVaultConnector } from "@gtsc/vault-models";
import type { IWalletConnector } from "@gtsc/wallet-models";
import type { Nft } from "./entities/nft";
import type { IEntityStorageNftConnectorConfig } from "./models/IEntityStorageNftConnectorConfig";

/**
 * Class for performing NFT operations on entity storage.
 */
export class EntityStorageNftConnector implements INftConnector {
	/**
	 * The namespace supported by the wallet connector.
	 */
	public static NAMESPACE: string = "entity-storage-nft";

	/**
	 * Runtime name for the class.
	 * @internal
	 */
	private static readonly _CLASS_NAME: string = nameof<EntityStorageNftConnector>();

	/**
	 * Connector for vault operations.
	 * @internal
	 */
	private readonly _vaultConnector: IVaultConnector;

	/**
	 * The entity storage for nfts.
	 * @internal
	 */
	private readonly _nftEntityStorage: IEntityStorageConnector<Nft>;

	/**
	 * The configuration for the connector.
	 * @internal
	 */
	private readonly _config: IEntityStorageNftConnectorConfig;

	/**
	 * Create a new instance of EntityStorageNftConnector.
	 * @param dependencies The dependencies for the class.
	 * @param dependencies.vaultConnector The vault connector.
	 * @param dependencies.nftEntityStorage The entity storage for nfts.
	 * @param config The configuration for the connector.
	 */
	constructor(
		dependencies: {
			vaultConnector: IVaultConnector;
			nftEntityStorage: IEntityStorageConnector<Nft>;
		},
		config?: IEntityStorageNftConnectorConfig
	) {
		Guards.object(EntityStorageNftConnector._CLASS_NAME, nameof(dependencies), dependencies);
		Guards.object<IVaultConnector>(
			EntityStorageNftConnector._CLASS_NAME,
			nameof(dependencies.vaultConnector),
			dependencies.vaultConnector
		);
		Guards.object<IWalletConnector>(
			EntityStorageNftConnector._CLASS_NAME,
			nameof(dependencies.nftEntityStorage),
			dependencies.nftEntityStorage
		);
		this._vaultConnector = dependencies.vaultConnector;
		this._nftEntityStorage = dependencies.nftEntityStorage;
		this._config = config ?? {};
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
			EntityStorageNftConnector._CLASS_NAME,
			nameof(requestContext),
			requestContext
		);
		Guards.stringValue(
			EntityStorageNftConnector._CLASS_NAME,
			nameof(requestContext.tenantId),
			requestContext.tenantId
		);
		Guards.stringValue(
			EntityStorageNftConnector._CLASS_NAME,
			nameof(requestContext.identity),
			requestContext.identity
		);
		Guards.stringValue(EntityStorageNftConnector._CLASS_NAME, nameof(tag), tag);

		try {
			const nftId = Converter.bytesToHex(RandomHelper.generate(32), true);

			await this._vaultConnector.createKey(requestContext, nftId, VaultKeyType.Ed25519);

			const nft: Nft = {
				id: nftId,
				owner: requestContext.identity,
				issuer: requestContext.identity,
				tag,
				immutableMetadata: Is.empty(immutableMetadata) ? "" : JSON.stringify(immutableMetadata),
				metadata: Is.empty(metadata) ? "" : JSON.stringify(metadata)
			};

			const stringifiedNft = JSON.stringify(nft);
			const docBytes = Converter.utf8ToBytes(stringifiedNft);
			const signature = await this._vaultConnector.sign(requestContext, nftId, docBytes);

			await this._nftEntityStorage.set(requestContext, {
				...nft,
				signature: Converter.bytesToBase64(signature)
			});

			return new Urn(EntityStorageNftConnector.NAMESPACE, nftId).toString();
		} catch (error) {
			throw new GeneralError(
				EntityStorageNftConnector._CLASS_NAME,
				"mintingFailed",
				undefined,
				error
			);
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
			EntityStorageNftConnector._CLASS_NAME,
			nameof(requestContext),
			requestContext
		);
		Guards.stringValue(
			EntityStorageNftConnector._CLASS_NAME,
			nameof(requestContext.tenantId),
			requestContext.tenantId
		);
		Guards.stringValue(
			EntityStorageNftConnector._CLASS_NAME,
			nameof(requestContext.identity),
			requestContext.identity
		);
		Urn.guard(EntityStorageNftConnector._CLASS_NAME, nameof(id), id);
		const urnParsed = Urn.fromValidString(id);

		if (urnParsed.namespaceIdentifier() !== EntityStorageNftConnector.NAMESPACE) {
			throw new GeneralError(EntityStorageNftConnector._CLASS_NAME, "namespaceMismatch", {
				namespace: EntityStorageNftConnector.NAMESPACE,
				id
			});
		}

		try {
			const nftId = urnParsed.namespaceSpecific();
			const nft = await this._nftEntityStorage.get(requestContext, nftId);

			if (Is.empty(nft)) {
				throw new NotFoundError(EntityStorageNftConnector._CLASS_NAME, "nftNotFound");
			}

			if (nft.owner !== requestContext.identity) {
				throw new GeneralError(EntityStorageNftConnector._CLASS_NAME, "notOwnerBurn");
			}

			await this._nftEntityStorage.remove(requestContext, nftId);

			await this._vaultConnector.removeKey(requestContext, nftId);
		} catch (error) {
			throw new GeneralError(
				EntityStorageNftConnector._CLASS_NAME,
				"burningFailed",
				undefined,
				error
			);
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
			EntityStorageNftConnector._CLASS_NAME,
			nameof(requestContext),
			requestContext
		);
		Guards.stringValue(
			EntityStorageNftConnector._CLASS_NAME,
			nameof(requestContext.tenantId),
			requestContext.tenantId
		);
		Guards.stringValue(
			EntityStorageNftConnector._CLASS_NAME,
			nameof(requestContext.identity),
			requestContext.identity
		);
		Urn.guard(EntityStorageNftConnector._CLASS_NAME, nameof(id), id);
		Guards.stringValue(EntityStorageNftConnector._CLASS_NAME, nameof(recipient), recipient);

		const urnParsed = Urn.fromValidString(id);
		if (urnParsed.namespaceIdentifier() !== EntityStorageNftConnector.NAMESPACE) {
			throw new GeneralError(EntityStorageNftConnector._CLASS_NAME, "namespaceMismatch", {
				namespace: EntityStorageNftConnector.NAMESPACE,
				id
			});
		}

		try {
			const nftId = urnParsed.namespaceSpecific();
			const nft = await this._nftEntityStorage.get(requestContext, nftId);

			if (Is.empty(nft)) {
				throw new NotFoundError(EntityStorageNftConnector._CLASS_NAME, "nftNotFound");
			}

			if (nft.owner !== requestContext.identity) {
				throw new GeneralError(EntityStorageNftConnector._CLASS_NAME, "notOwnerTransfer");
			}

			const signature = nft.signature;
			delete nft.signature;

			let stringifiedNft = JSON.stringify(nft);
			let docBytes = Converter.utf8ToBytes(stringifiedNft);
			const verified = await this._vaultConnector.verify(
				requestContext,
				nftId,
				docBytes,
				Converter.base64ToBytes(signature ?? "")
			);
			if (!verified) {
				throw new GeneralError(EntityStorageNftConnector._CLASS_NAME, "signatureFailed");
			}

			await this._vaultConnector.removeKey(requestContext, nftId);

			nft.owner = recipient;

			const recipientContext: IRequestContext = {
				...requestContext,
				identity: recipient
			};

			await this._vaultConnector.createKey(recipientContext, nftId, VaultKeyType.Ed25519);

			stringifiedNft = JSON.stringify(nft);
			docBytes = Converter.utf8ToBytes(stringifiedNft);

			const recipientSignature = await this._vaultConnector.sign(recipientContext, nftId, docBytes);
			await this._nftEntityStorage.set(requestContext, {
				...nft,
				signature: Converter.bytesToBase64(recipientSignature)
			});

			await this._nftEntityStorage.set(recipientContext, nft);
		} catch (error) {
			throw new GeneralError(
				EntityStorageNftConnector._CLASS_NAME,
				"transferFailed",
				undefined,
				error
			);
		}
	}
}
