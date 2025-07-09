// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { BaseRestClient } from "@twin.org/api-core";
import type { IBaseRestClientConfig, ICreatedResponse } from "@twin.org/api-models";
import { Guards, Urn } from "@twin.org/core";
import { nameof } from "@twin.org/nameof";
import type {
	INftBurnRequest,
	INftComponent,
	INftMintRequest,
	INftResolveRequest,
	INftResolveResponse,
	INftTransferRequest,
	INftUpdateRequest
} from "@twin.org/nft-models";
import { HeaderTypes } from "@twin.org/web";

/**
 * Client for performing NFT through to REST endpoints.
 */
export class NftClient extends BaseRestClient implements INftComponent {
	/**
	 * Runtime name for the class.
	 */
	public readonly CLASS_NAME: string = nameof<NftClient>();

	/**
	 * Create a new instance of NftClient.
	 * @param config The configuration for the client.
	 */
	constructor(config: IBaseRestClientConfig) {
		super(nameof<NftClient>(), config, "nft");
	}

	/**
	 * Mint an NFT.
	 * @param tag The tag for the NFT.
	 * @param immutableMetadata The immutable metadata for the NFT.
	 * @param metadata The metadata for the NFT.
	 * @param namespace The namespace of the connector to use for the NFT, defaults to component configured namespace.
	 * @returns The id of the created NFT in urn format.
	 */
	public async mint<T = unknown, U = unknown>(
		tag: string,
		immutableMetadata?: T,
		metadata?: U,
		namespace?: string
	): Promise<string> {
		Guards.stringValue(this.CLASS_NAME, nameof(tag), tag);

		const response = await this.fetch<INftMintRequest, ICreatedResponse>("/", "POST", {
			body: {
				tag,
				immutableMetadata,
				metadata,
				namespace
			}
		});

		return response.headers[HeaderTypes.Location];
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
		Guards.stringValue(this.CLASS_NAME, nameof(id), id);

		const response = await this.fetch<INftResolveRequest, INftResolveResponse>("/:id", "GET", {
			pathParams: {
				id
			}
		});

		return response.body as {
			issuer: string;
			owner: string;
			tag: string;
			immutableMetadata?: T;
			metadata?: U;
		};
	}

	/**
	 * Burn an NFT.
	 * @param id The id of the NFT to burn in urn format.
	 * @returns Nothing.
	 */
	public async burn(id: string): Promise<void> {
		Urn.guard(this.CLASS_NAME, nameof(id), id);

		await this.fetch<INftBurnRequest, never>("/:id", "DELETE", {
			pathParams: {
				id
			}
		});
	}

	/**
	 * Transfer an NFT.
	 * @param id The id of the NFT to transfer in urn format.
	 * @param recipientIdentity The recipient identity for the NFT.
	 * @param recipientAddress The recipient address for the NFT.
	 * @param metadata Optional mutable data to include during the transfer.
	 * @returns Nothing.
	 */
	public async transfer<T = unknown>(
		id: string,
		recipientIdentity: string,
		recipientAddress: string,
		metadata?: T
	): Promise<void> {
		Guards.stringValue(this.CLASS_NAME, nameof(id), id);
		Guards.stringValue(this.CLASS_NAME, nameof(recipientIdentity), recipientIdentity);
		Guards.stringValue(this.CLASS_NAME, nameof(recipientAddress), recipientAddress);

		await this.fetch<INftTransferRequest, never>("/:id/transfer", "POST", {
			pathParams: {
				id
			},
			body: {
				recipientIdentity,
				recipientAddress,
				metadata
			}
		});
	}

	/**
	 * Update the data of the NFT.
	 * @param id The id of the NFT to update in urn format.
	 * @param metadata The mutable data to update.
	 * @returns Nothing.
	 */
	public async update<U = unknown>(id: string, metadata: U): Promise<void> {
		Guards.stringValue(this.CLASS_NAME, nameof(id), id);
		Guards.object(this.CLASS_NAME, nameof(metadata), metadata);

		await this.fetch<INftUpdateRequest, never>("/:id", "PUT", {
			pathParams: {
				id
			},
			body: {
				metadata
			}
		});
	}
}
