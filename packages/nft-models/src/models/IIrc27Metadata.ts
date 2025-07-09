// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Model defining the IRC27 NFT Standards.
 * https://github.com/iotaledger/tips/blob/main/tips/TIP-0027/tip-0027.md
 */
export interface IIrc27Metadata {
	/**
	 * The standard marker.
	 */
	standard: "IRC27";

	/**
	 * The version
	 */
	version: "v1.0";

	/**
	 * A mime type for the content of the NFT.
	 */
	type: string;

	/**
	 * Url pointing to the NFT file location with MIME type defined in type.
	 */
	uri: string;

	/**
	 * Alphanumeric text string defining the human identifiable name for the NFT
	 */
	name: string;

	/**
	 * Alphanumeric text string defining the human identifiable collection name.
	 */
	collectionName?: string;

	/**
	 * Object containing key value pair where payment address mapped to the payout percentage.
	 */
	royalties?: {
		[id: string]: number;
	};

	/**
	 * Alphanumeric text string to define the human identifiable name of the creator.
	 */
	issuerName?: string;

	/**
	 * Alphanumeric text string to define a basic description of the NFT.
	 */
	description?: string;

	/**
	 * Array objects defining additional attributes of the NFT
	 */
	attributes?: {
		trait_type: string;
		value: unknown;
	}[];
}
