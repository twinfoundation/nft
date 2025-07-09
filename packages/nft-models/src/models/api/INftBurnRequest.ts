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
		 * The id of the NFT to burn.
		 */
		id: string;
	};
}
