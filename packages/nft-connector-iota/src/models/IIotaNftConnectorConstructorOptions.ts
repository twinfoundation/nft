// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IIotaNftConnectorConfig } from "./IIotaNftConnectorConfig";

/**
 * Options for the IOTA nft connector constructor.
 */
export interface IIotaNftConnectorConstructorOptions {
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
	config: IIotaNftConnectorConfig;
}
