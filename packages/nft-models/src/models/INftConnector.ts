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
	 * @param metadata The metadata for the NFT.
	 * @param immutableMetadata The immutable metadata for the NFT.
	 * @returns The id of the created NFT.
	 */
	mint<T = unknown, U = unknown>(
		requestContext: IRequestContext,
		tag: string,
		metadata: T | undefined,
		immutableMetadata: U | undefined
	): Promise<string>;
}
