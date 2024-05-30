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
	 * @param tag The tag for the NFT.
	 * @param immutableMetadata The immutable metadata for the NFT.
	 * @param metadata The metadata for the NFT.
	 * @returns The id of the created NFT in urn format.
	 */
	mint<T = unknown, U = unknown>(
		requestContext: IRequestContext,
		tag: string,
		immutableMetadata: T | undefined,
		metadata: U | undefined
	): Promise<string>;

	/**
	 * Burn an NFT.
	 * @param requestContext The context for the request.
	 * @param id The id of the NFT to burn in urn format.
	 * @returns Nothing.
	 */
	burn(requestContext: IRequestContext, id: string): Promise<void>;

	/**
	 * Transfer an NFT.
	 * @param requestContext The context for the request.
	 * @param id The id of the NFT to transfer in urn format.
	 * @param recipient The recipient identity of the NFT.
	 * @returns Nothing.
	 */
	transfer(requestContext: IRequestContext, id: string, recipient: string): Promise<void>;
}
