// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { GeneralError, Guards, Urn } from "@gtsc/core";
import { nameof } from "@gtsc/nameof";
import { NftConnectorFactory, type INft, type INftConnector } from "@gtsc/nft-models";
import type { IRequestContext } from "@gtsc/services";
import type { INftServiceConfig } from "./models/INftServiceConfig";

/**
 * Service for performing NFT operations to a connector.
 */
export class NftService implements INft {
	/**
	 * Runtime name for the class.
	 * @internal
	 */
	private static readonly _CLASS_NAME: string = nameof<NftService>();

	/**
	 * The default namespace for the connector to use.
	 * @internal
	 */
	private readonly _defaultNamespace: string;

	/**
	 * Create a new instance of NftService.
	 * @param config The configuration for the service.
	 */
	constructor(config?: INftServiceConfig) {
		const names = NftConnectorFactory.names();
		if (names.length === 0) {
			throw new GeneralError(NftService._CLASS_NAME, "noConnectors");
		}

		this._defaultNamespace = config?.defaultNamespace ?? names[0];
	}

	/**
	 * Mint an NFT.
	 * @param requestContext The context for the request.
	 * @param issuer The issuer for the NFT, will also be the initial owner.
	 * @param tag The tag for the NFT.
	 * @param immutableMetadata The immutable metadata for the NFT.
	 * @param metadata The metadata for the NFT.
	 * @param options Additional options for the NFT service.
	 * @param options.namespace The namespace of the connector to use for the NFT, defaults to service configured namespace.
	 * @returns The id of the created NFT in urn format.
	 */
	public async mint<T = unknown, U = unknown>(
		requestContext: IRequestContext,
		issuer: string,
		tag: string,
		immutableMetadata?: T,
		metadata?: U,
		options?: {
			namespace?: string;
		}
	): Promise<string> {
		Guards.object<IRequestContext>(NftService._CLASS_NAME, nameof(requestContext), requestContext);
		Guards.stringValue(
			NftService._CLASS_NAME,
			nameof(requestContext.tenantId),
			requestContext.tenantId
		);
		Guards.stringValue(
			NftService._CLASS_NAME,
			nameof(requestContext.identity),
			requestContext.identity
		);
		Guards.stringValue(NftService._CLASS_NAME, nameof(issuer), issuer);
		Guards.stringValue(NftService._CLASS_NAME, nameof(tag), tag);

		try {
			const connectorNamespace = options?.namespace ?? this._defaultNamespace;

			const nftConnector = NftConnectorFactory.get<INftConnector>(connectorNamespace);

			return nftConnector.mint(requestContext, issuer, tag, immutableMetadata, metadata);
		} catch (error) {
			throw new GeneralError(NftService._CLASS_NAME, "mintFailed", undefined, error);
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
		Guards.object<IRequestContext>(NftService._CLASS_NAME, nameof(requestContext), requestContext);
		Guards.stringValue(
			NftService._CLASS_NAME,
			nameof(requestContext.tenantId),
			requestContext.tenantId
		);
		Guards.stringValue(
			NftService._CLASS_NAME,
			nameof(requestContext.identity),
			requestContext.identity
		);
		Guards.stringValue(NftService._CLASS_NAME, nameof(id), id);

		Urn.guard(NftService._CLASS_NAME, nameof(id), id);

		try {
			const idUri = Urn.fromValidString(id);
			const connectorNamespace = idUri.namespaceIdentifier();

			const nftConnector = NftConnectorFactory.get<INftConnector>(connectorNamespace);

			return nftConnector.resolve(requestContext, id);
		} catch (error) {
			throw new GeneralError(NftService._CLASS_NAME, "resolveFailed", undefined, error);
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
		Guards.object<IRequestContext>(NftService._CLASS_NAME, nameof(requestContext), requestContext);
		Guards.stringValue(
			NftService._CLASS_NAME,
			nameof(requestContext.tenantId),
			requestContext.tenantId
		);
		Guards.stringValue(
			NftService._CLASS_NAME,
			nameof(requestContext.identity),
			requestContext.identity
		);
		Guards.stringValue(NftService._CLASS_NAME, nameof(owner), owner);
		Guards.stringValue(NftService._CLASS_NAME, nameof(id), id);

		Urn.guard(NftService._CLASS_NAME, nameof(id), id);

		try {
			const idUri = Urn.fromValidString(id);
			const connectorNamespace = idUri.namespaceIdentifier();

			const nftConnector = NftConnectorFactory.get<INftConnector>(connectorNamespace);

			await nftConnector.burn(requestContext, owner, id);
		} catch (error) {
			throw new GeneralError(NftService._CLASS_NAME, "burnFailed", undefined, error);
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
		Guards.object<IRequestContext>(NftService._CLASS_NAME, nameof(requestContext), requestContext);
		Guards.stringValue(
			NftService._CLASS_NAME,
			nameof(requestContext.tenantId),
			requestContext.tenantId
		);
		Guards.stringValue(
			NftService._CLASS_NAME,
			nameof(requestContext.identity),
			requestContext.identity
		);
		Guards.stringValue(NftService._CLASS_NAME, nameof(id), id);
		Guards.stringValue(NftService._CLASS_NAME, nameof(recipient), recipient);

		try {
			const idUri = Urn.fromValidString(id);
			const connectorNamespace = idUri.namespaceIdentifier();

			const nftConnector = NftConnectorFactory.get<INftConnector>(connectorNamespace);

			await nftConnector.transfer(requestContext, id, recipient);
		} catch (error) {
			throw new GeneralError(NftService._CLASS_NAME, "transferFailed", undefined, error);
		}
	}

	/**
	 * Update the data of the NFT.
	 * @param requestContext The context for the request.
	 * @param id The id of the NFT to update in urn format.
	 * @param metadata The mutable data to update.
	 * @returns Nothing.
	 */
	public async update<T = unknown>(
		requestContext: IRequestContext,
		id: string,
		metadata: T
	): Promise<void> {
		Guards.object<IRequestContext>(NftService._CLASS_NAME, nameof(requestContext), requestContext);
		Guards.stringValue(
			NftService._CLASS_NAME,
			nameof(requestContext.tenantId),
			requestContext.tenantId
		);
		Guards.stringValue(
			NftService._CLASS_NAME,
			nameof(requestContext.identity),
			requestContext.identity
		);
		Guards.stringValue(NftService._CLASS_NAME, nameof(id), id);
		Guards.stringValue(NftService._CLASS_NAME, nameof(metadata), metadata);

		try {
			const idUri = Urn.fromValidString(id);
			const connectorNamespace = idUri.namespaceIdentifier();

			const nftConnector = NftConnectorFactory.get<INftConnector>(connectorNamespace);

			await nftConnector.update(requestContext, id, metadata);
		} catch (error) {
			throw new GeneralError(NftService._CLASS_NAME, "updateFailed", undefined, error);
		}
	}
}
