// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IIotaStardustConfig } from "@twin.org/dlt-iota-stardust";

/**
 * Configuration for the IOTA Stardust NFT connector.
 */
export interface IIotaStardustNftConnectorConfig extends IIotaStardustConfig {
	/**
	 * The wallet address index to use to store the NFTs on.
	 * @default 0
	 */
	walletAddressIndex?: number;
}
