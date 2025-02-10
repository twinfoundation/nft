// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IIotaStardustNftConnectorConfig } from "./IIotaStardustNftConnectorConfig";

/**
 * Options for the IOTA Stardust NFT connector constructor.
 */
export interface IIotaStardustNftConnectorConstructorOptions {
	/**
	 * The type of the vault connector.
	 * @default vault
	 */
	vaultConnectorType?: string;

	/**
	 * The type of the wallet connector.
	 * @default wallet
	 */
	walletConnectorType?: string;

	/**
	 * The configuration for the connector.
	 */
	config: IIotaStardustNftConnectorConfig;
}
