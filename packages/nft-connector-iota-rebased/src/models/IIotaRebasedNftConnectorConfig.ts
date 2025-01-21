// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IIotaRebasedConfig } from "@twin.org/dlt-iota-rebased";

/**
 * Configuration for the IOTA Rebased NFT Connector.
 */
export interface IIotaRebasedNftConnectorConfig extends IIotaRebasedConfig {
	/**
	 * The name of the contract to use.
	 * @default "nft"
	 */
	contractName?: string;

	/**
	 * The gas budget to use for transactions.
	 * @default 1_000_000_000
	 */
	gasBudget?: number;

	/**
	 * The package controller address index to use when creating package.
	 * @default 0
	 */
	packageControllerAddressIndex?: number;
}
