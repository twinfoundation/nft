// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IIotaConfig } from "@twin.org/dlt-iota";

/**
 * Configuration for the IOTA NFT Connector.
 */
export interface IIotaNftConnectorConfig extends IIotaConfig {
	/**
	 * The name of the contract to use.
	 * @default "nft"
	 */
	contractName?: string;

	/**
	 * The package controller address index to use when creating package.
	 * @default 0
	 */
	packageControllerAddressIndex?: number;

	/**
	 * The wallet address index to use when creating NFT.
	 * @default 0
	 */
	walletAddressIndex?: number;

	/**
	 * Enable cost logging.
	 * @default false
	 */
	enableCostLogging?: boolean;
}
