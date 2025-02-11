// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Interface representing the storage fields of an NFT.
 */
export interface INftFields {
	/**
	 * The ID of the NFT.
	 */
	id: {
		/**
		 * The ID of the NFT.
		 */
		id: string; // UID is an object with an 'id' field
	};
	/**
	 * The immutable metadata of the NFT.
	 */
	immutable_metadata: string;
	/**
	 * The tag of the NFT.
	 */
	tag: string;
	/**
	 * The metadata of the NFT.
	 */
	metadata: string;
	/**
	 * The issuer of the NFT.
	 */
	issuer: string;
	/**
	 * The issuer identity of the NFT.
	 */
	issuerIdentity: string;
	/**
	 * The owner identity of the NFT.
	 */
	ownerIdentity: string;
}
