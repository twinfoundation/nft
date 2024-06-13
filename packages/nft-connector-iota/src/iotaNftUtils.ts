// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Urn } from "@gtsc/core";
import { Utils } from "@iota/sdk-wasm/node/lib/index.js";

/**
 * Utility functions for the iota nfts.
 */
export class IotaNftUtils {
	/**
	 * Convert an NFT id to a bech32 address.
	 * @param nftIdUrn The NFT id to convert in urn format.
	 * @returns The address.
	 */
	public static nftIdToAddress(nftIdUrn: string): string {
		// The nftId is made up from iota-nft:hrp:aliasId
		const nftUrn = Urn.fromValidString(nftIdUrn);
		const didParts = nftUrn.parts(true);
		return Utils.nftIdToBech32(didParts[2], didParts[1]);
	}
}
