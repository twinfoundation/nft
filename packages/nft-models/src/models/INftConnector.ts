// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IRequestContext } from "@gtsc/services";

/**
 * Interface describing an NFT connector.
 */
export interface INftConnector {
	/**
	 * Mint an NFT.
	 * @param requestContext The context for the request.
	 * @param issuer The issuer for the NFT.
	 * @param tag The tag for the NFT.
	 * @param immutableMetadata The immutable metadata for the NFT.
	 * @param metadata The metadata for the NFT.
	 * @returns The id of the created NFT in urn format.
	 */
	mint<T = unknown, U = unknown>(
		requestContext: IRequestContext,
		issuer: string,
		tag: string,
		immutableMetadata?: T,
		metadata?: U
	): Promise<string>;

	/**
	 * Burn an NFT.
	 * @param requestContext The context for the request.
	 * @param issuer The issuer for the NFT to return the funds to.
	 * @param id The id of the NFT to burn in urn format.
	 * @returns Nothing.
	 */
	burn(requestContext: IRequestContext, issuer: string, id: string): Promise<void>;

	/**
	 * Transfer an NFT.
	 * @param requestContext The context for the request.
	 * @param id The id of the NFT to transfer in urn format.
	 * @param recipient The recipient of the NFT.
	 * @returns Nothing.
	 */
	transfer(requestContext: IRequestContext, id: string, recipient: string): Promise<void>;
}
