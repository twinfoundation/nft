// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Response to resolving the NFT.
 */
export interface INftResolveResponse<T = unknown, U = unknown> {
	/**
	 * The data that was resolved.
	 */
	body: {
		/**
		 * The issuer of the NFT.
		 */
		issuer: string;

		/**
		 * The owner of the NFT.
		 */
		owner: string;

		/**
		 * The tag data for the NFT.
		 */
		tag: string;

		/**
		 * The immutable data for the NFT.
		 */
		immutableMetadata?: T;

		/**
		 * The metadata for the NFT.
		 */
		metadata?: U;
	};
}
