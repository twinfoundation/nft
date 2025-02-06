// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IIotaConfig } from "@twin.org/dlt-iota";

/**
 * Configuration for the IOTA NFT connector.
 */
export interface IIotaNftConnectorConfig extends IIotaConfig {
	/**
	 * The wallet address index to use to store the NFTs on.
	 * @default 0
	 */
	walletAddressIndex?: number;
}
