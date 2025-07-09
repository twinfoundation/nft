// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IIotaNftConnectorConfig } from "./IIotaNftConnectorConfig";

/**
 * Options for the IotaNftConnector.
 */
export interface IIotaNftConnectorConstructorOptions {
	/**
	 * The configuration to use for the connector.
	 */
	config: IIotaNftConnectorConfig;

	/**
	 * The vault connector type to use.
	 * @default "vault"
	 */
	vaultConnectorType?: string;

	/**
	 * The wallet connector type to use.
	 * @default "wallet"
	 */
	walletConnectorType?: string;

	/**
	 * The logging connector type.
	 * @default logging
	 */
	loggingConnectorType?: string;
}
