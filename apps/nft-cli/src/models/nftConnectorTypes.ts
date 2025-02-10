// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * The NFT connector types.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const NftConnectorTypes = {
	/**
	 * IOTA.
	 */
	Iota: "iota",

	/**
	 * IOTA Stardust.
	 */
	IotaStardust: "iota-stardust"
} as const;

/**
 * The NFT connector types.
 */
export type NftConnectorTypes = (typeof NftConnectorTypes)[keyof typeof NftConnectorTypes];
