// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { GeneralError, Urn } from "@twin.org/core";
import { nameof } from "@twin.org/nameof";

/**
 * Utility functions for the iota rebased nfts.
 */
export class IotaRebasedNftUtils {
	/**
	 * Runtime name for the class.
	 */
	public static readonly CLASS_NAME: string = nameof<IotaRebasedNftUtils>();

	/**
	 * Convert an NFT id to an object id.
	 * @param nftIdUrn The NFT id to convert in urn format.
	 * @returns The object id.
	 * @throws GeneralError if the NFT id is invalid.
	 */
	public static nftIdToObjectId(nftIdUrn: string): string {
		// The nftId is made up from nft:iota-rebased:devnet:packageId:objectid
		const nftUrn = Urn.fromValidString(nftIdUrn);
		const parts = nftUrn.parts();
		if (parts.length !== 5) {
			throw new GeneralError(IotaRebasedNftUtils.CLASS_NAME, "invalidNftIdFormat", {
				id: nftIdUrn
			});
		}
		return parts[4];
	}

	/**
	 * Convert an NFT id to a package id.
	 * @param nftIdUrn The NFT id to convert in urn format.
	 * @returns The package id.
	 * @throws GeneralError if the NFT id is invalid.
	 */
	public static nftIdToPackageId(nftIdUrn: string): string {
		// The nftId is made up from nft:iota-rebased:devnet:packageId:objectid
		const nftUrn = Urn.fromValidString(nftIdUrn);
		const parts = nftUrn.parts();
		if (parts.length !== 5) {
			throw new GeneralError(IotaRebasedNftUtils.CLASS_NAME, "invalidNftIdFormat", {
				id: nftIdUrn
			});
		}
		return parts[3];
	}
}
