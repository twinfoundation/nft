// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Resolve the NFT.
 */
export interface INftResolveRequest {
	/**
	 * The data to be used for resolving.
	 */
	pathParams: {
		/**
		 * The id of the NFT to resolve.
		 */
		id: string;
	};
}
