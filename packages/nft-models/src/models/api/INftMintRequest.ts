// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Mint the data and return the NFT id.
 */
export interface INftMintRequest {
	/**
	 * The data to be used in the minting.
	 */
	body: {
		/**
		 * The issuer for the NFT, will also be the initial owner.
		 */
		issuer: string;

		/**
		 * The tag for the NFT.
		 */
		tag: string;

		/**
		 * The immutable metadata for the NFT.
		 */
		immutableMetadata?: unknown;

		/**
		 * The metadata for the NFT.
		 */
		metadata?: unknown;

		/**
		 * The namespace of the connector to use for the NFT, defaults to service configured namespace.
		 */
		namespace?: string;
	};
}
