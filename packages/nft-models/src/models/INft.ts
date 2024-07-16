// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IServiceRequestContext, IService } from "@gtsc/services";

/**
 * Interface describing an NFT service.
 */
export interface INft extends IService {
	/**
	 * Mint an NFT.
	 * @param issuer The issuer for the NFT, will also be the initial owner.
	 * @param tag The tag for the NFT.
	 * @param immutableMetadata The immutable metadata for the NFT.
	 * @param metadata The metadata for the NFT.
	 * @param options Additional options for the NFT service.
	 * @param options.namespace The namespace of the connector to use for the NFT, defaults to service configured namespace.
	 * @param requestContext The context for the request.
	 * @returns The id of the created NFT in urn format.
	 */
	mint<T = unknown, U = unknown>(
		issuer: string,
		tag: string,
		immutableMetadata?: T,
		metadata?: U,
		options?: {
			namespace?: string;
		},
		requestContext?: IServiceRequestContext
	): Promise<string>;

	/**
	 * Resolve an NFT.
	 * @param id The id of the NFT to resolve.
	 * @param requestContext The context for the request.
	 * @returns The data for the NFT.
	 */
	resolve<T = unknown, U = unknown>(
		id: string,
		requestContext?: IServiceRequestContext
	): Promise<{
		issuer: string;
		owner: string;
		tag: string;
		immutableMetadata?: T;
		metadata?: U;
	}>;

	/**
	 * Burn an NFT.
	 * @param owner The owner for the NFT to return the funds to.
	 * @param id The id of the NFT to burn in urn format.
	 * @param requestContext The context for the request.
	 * @returns Nothing.
	 */
	burn(owner: string, id: string, requestContext?: IServiceRequestContext): Promise<void>;

	/**
	 * Transfer an NFT.
	 * @param id The id of the NFT to transfer in urn format.
	 * @param recipient The recipient of the NFT.
	 * @param metadata Optional mutable data to include during the transfer.
	 * @param requestContext The context for the request.
	 * @returns Nothing.
	 */
	transfer<T = unknown>(
		id: string,
		recipient: string,
		metadata?: T,
		requestContext?: IServiceRequestContext
	): Promise<void>;

	/**
	 * Update the mutable data of the NFT.
	 * @param id The id of the NFT to update in urn format.
	 * @param metadata The mutable data to update.
	 * @param requestContext The context for the request.
	 * @returns Nothing.
	 */
	update<T = unknown>(
		id: string,
		metadata: T,
		requestContext?: IServiceRequestContext
	): Promise<void>;
}
