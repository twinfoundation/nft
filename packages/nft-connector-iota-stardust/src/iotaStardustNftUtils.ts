// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Utils } from "@iota/sdk-wasm/node/lib/index.js";
import { Urn } from "@twin.org/core";

/**
 * Utility functions for the IOTA Stardust NFTs.
 */
export class IotaStardustNftUtils {
	/**
	 * Convert an NFT id to a bech32 address.
	 * @param nftIdUrn The NFT id to convert in urn format.
	 * @returns The address.
	 */
	public static nftIdToAddress(nftIdUrn: string): string {
		// The nftId is made up from nft:iota-stardust:hrp:aliasId
		const nftUrn = Urn.fromValidString(nftIdUrn);
		const didParts = nftUrn.parts();
		return Utils.nftIdToBech32(didParts[3], didParts[2]);
	}
}
