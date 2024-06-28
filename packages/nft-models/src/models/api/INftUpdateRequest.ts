// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Update the mutable data for the NFT.
 */
export interface INftUpdateRequest<T = unknown> {
	/**
	 * The data to be used in the transfer.
	 */
	pathParams: {
		/**
		 * The id of the NFT to transfer in urn format.
		 */
		id: string;
	};

	/**
	 * The data to be used in the minting.
	 */
	body: {
		/**
		 * The metadata for the NFT.
		 */
		metadata?: T;
	};
}
