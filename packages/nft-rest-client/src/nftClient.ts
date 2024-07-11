// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { BaseRestClient } from "@gtsc/api-core";
import type { IBaseRestClientConfig } from "@gtsc/api-models";
import { Guards, StringHelper } from "@gtsc/core";
import { nameof } from "@gtsc/nameof";
import type {
	INft,
	INftBurnRequest,
	INftMintRequest,
	INftMintResponse,
	INftResolveRequest,
	INftResolveResponse,
	INftTransferRequest,
	INftUpdateRequest
} from "@gtsc/nft-models";
import type { IRequestContext } from "@gtsc/services";

/**
 * Client for performing NFT through to REST endpoints.
 */
export class NftClient extends BaseRestClient implements INft {
	/**
	 * Runtime name for the class.
	 * @internal
	 */
	private static readonly _CLASS_NAME: string = nameof<NftClient>();

	/**
	 * Runtime name for the class.
	 */
	public readonly CLASS_NAME: string = NftClient._CLASS_NAME;

	/**
	 * Create a new instance of NftClient.
	 * @param config The configuration for the client.
	 */
	constructor(config: IBaseRestClientConfig) {
		super(NftClient._CLASS_NAME, config, StringHelper.kebabCase(nameof<INft>()));
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
		Guards.object<IRequestContext>(this.CLASS_NAME, nameof(requestContext), requestContext);
		Guards.stringValue(this.CLASS_NAME, nameof(requestContext.tenantId), requestContext.tenantId);
		Guards.stringValue(this.CLASS_NAME, nameof(requestContext.identity), requestContext.identity);
		Guards.stringValue(this.CLASS_NAME, nameof(issuer), issuer);
		Guards.stringValue(this.CLASS_NAME, nameof(tag), tag);

		const response = await this.fetch<INftMintRequest<T, U>, INftMintResponse>(
			requestContext,
			"/",
			"POST",
			{
				body: {
					issuer,
					tag,
					immutableMetadata,
					metadata,
					namespace: options?.namespace
				}
			}
		);

		return response.headers.Location;
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

		const response = await this.fetch<INftResolveRequest, INftResolveResponse<T, U>>(
			requestContext,
			"/:id",
			"GET",
			{
				pathParams: {
					id
				}
			}
		);

		return response.body;
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
		Guards.stringValue(this.CLASS_NAME, nameof(id), id);

		await this.fetch<INftBurnRequest, never>(requestContext, "/:id/burn", "POST", {
			pathParams: {
				id
			},
			body: {
				owner
			}
		});
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
		Guards.object<IRequestContext>(this.CLASS_NAME, nameof(requestContext), requestContext);
		Guards.stringValue(this.CLASS_NAME, nameof(requestContext.tenantId), requestContext.tenantId);
		Guards.stringValue(this.CLASS_NAME, nameof(requestContext.identity), requestContext.identity);
		Guards.stringValue(this.CLASS_NAME, nameof(id), id);
		Guards.stringValue(this.CLASS_NAME, nameof(recipient), recipient);

		await this.fetch<INftTransferRequest, never>(requestContext, "/:id/transfer", "POST", {
			pathParams: {
				id
			},
			body: {
				recipient,
				metadata
			}
		});
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
		Guards.object<IRequestContext>(this.CLASS_NAME, nameof(requestContext), requestContext);
		Guards.stringValue(this.CLASS_NAME, nameof(requestContext.tenantId), requestContext.tenantId);
		Guards.stringValue(this.CLASS_NAME, nameof(requestContext.identity), requestContext.identity);
		Guards.stringValue(this.CLASS_NAME, nameof(id), id);
		Guards.stringValue(this.CLASS_NAME, nameof(metadata), metadata);

		await this.fetch<INftUpdateRequest, never>(requestContext, "/:id", "PUT", {
			pathParams: {
				id
			},
			body: {
				metadata
			}
		});
	}
}
