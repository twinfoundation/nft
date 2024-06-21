// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Converter, GeneralError, Guards, Is, NotFoundError, RandomHelper, Urn } from "@gtsc/core";
import {
	EntityStorageConnectorFactory,
	type IEntityStorageConnector
} from "@gtsc/entity-storage-models";
import { nameof } from "@gtsc/nameof";
import type { INftConnector } from "@gtsc/nft-models";
import type { IRequestContext } from "@gtsc/services";
import type { Nft } from "./entities/nft";

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
	 * The entity storage for nfts.
	 * @internal
	 */
	private readonly _nftEntityStorage: IEntityStorageConnector<Nft>;

	/**
	 * Create a new instance of EntityStorageNftConnector.
	 * @param options The dependencies for the class.
	 * @param options.nftEntityStorageType The entity storage for nfts, defaults to "nft".
	 */
	constructor(options?: { nftEntityStorageType?: string }) {
		this._nftEntityStorage = EntityStorageConnectorFactory.get(
			options?.nftEntityStorageType ?? "nft"
		);
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
		Guards.stringValue(EntityStorageNftConnector._CLASS_NAME, nameof(issuer), issuer);
		Guards.stringValue(EntityStorageNftConnector._CLASS_NAME, nameof(tag), tag);

		try {
			const nftId = Converter.bytesToHex(RandomHelper.generate(32), true);

			const nft: Nft = {
				id: nftId,
				issuer,
				owner: issuer,
				tag,
				immutableMetadata: Is.empty(immutableMetadata) ? "" : JSON.stringify(immutableMetadata),
				metadata: Is.empty(metadata) ? "" : JSON.stringify(metadata)
			};

			await this._nftEntityStorage.set(requestContext, nft);

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
		Guards.stringValue(EntityStorageNftConnector._CLASS_NAME, nameof(id), id);

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

			return {
				owner: nft.owner,
				issuer: nft.issuer,
				tag: nft.tag,
				immutableMetadata: Is.stringValue(nft.immutableMetadata)
					? JSON.parse(nft.immutableMetadata)
					: undefined,
				metadata: Is.stringValue(nft.metadata) ? JSON.parse(nft.metadata) : undefined
			};
		} catch (error) {
			throw new GeneralError(
				EntityStorageNftConnector._CLASS_NAME,
				"resolvingFailed",
				undefined,
				error
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
		Guards.stringValue(EntityStorageNftConnector._CLASS_NAME, nameof(owner), owner);
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

			if (nft.owner !== owner) {
				throw new GeneralError(EntityStorageNftConnector._CLASS_NAME, "notOwnerBurn");
			}

			await this._nftEntityStorage.remove(requestContext, nftId);
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
	 * @param recipient The recipient of the NFT.
	 * @param metadata Optional mutable data to include during the transfer.
	 * @returns Nothing.
	 */
	public async transfer<T = unknown>(
		requestContext: IRequestContext,
		id: string,
		recipient: string,
		metadata?: T
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

			nft.owner = recipient;
			nft.metadata = Is.empty(metadata) ? nft.metadata : JSON.stringify(metadata);

			await this._nftEntityStorage.set(requestContext, nft);
		} catch (error) {
			throw new GeneralError(
				EntityStorageNftConnector._CLASS_NAME,
				"transferFailed",
				undefined,
				error
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
	public async updateMutable<T = unknown>(
		requestContext: IRequestContext,
		id: string,
		metadata: T
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
		Guards.object<T>(EntityStorageNftConnector._CLASS_NAME, nameof(metadata), metadata);

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

			nft.metadata = JSON.stringify(metadata);

			await this._nftEntityStorage.set(requestContext, nft);
		} catch (error) {
			throw new GeneralError(
				EntityStorageNftConnector._CLASS_NAME,
				"updateFailed",
				undefined,
				error
			);
		}
	}
}
