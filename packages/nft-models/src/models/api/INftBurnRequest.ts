// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Burn the NFT.
 */
export interface INftBurnRequest {
	/**
	 * The data to be used for resolving.
	 */
	pathParams: {
		/**
		 * The id of the NFT to resolve.
		 */
		id: string;
	};

	/**
	 * The data to be used for burning.
	 */
	body: {
		/**
		 * The owner for the NFT to return the funds to.
		 */
		owner: string;
	};
}
