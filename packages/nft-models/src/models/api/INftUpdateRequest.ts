// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Update the mutable data for the NFT.
 */
export interface INftUpdateRequest {
	/**
	 * The data to be used in the update.
	 */
	pathParams: {
		/**
		 * The id of the NFT to transfer in urn format.
		 */
		id: string;
	};

	/**
	 * The data to be used in the update.
	 */
	body: {
		/**
		 * The metadata for the NFT.
		 */
		metadata?: unknown;
	};
}
