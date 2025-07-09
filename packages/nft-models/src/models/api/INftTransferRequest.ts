// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Transfer the NFT and update the metadata.
 */
export interface INftTransferRequest {
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
	 * The data to be used in the transfer.
	 */
	body: {
		/**
		 * The recipient identity for the NFT.
		 */
		recipientIdentity: string;

		/**
		 * The recipient address for the NFT.
		 */
		recipientAddress: string;

		/**
		 * The metadata for the NFT.
		 */
		metadata?: unknown;
	};
}
