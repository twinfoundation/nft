// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IIotaRebasedNftConnectorConfig } from "./IIotaRebasedNftConnectorConfig";

/**
 * Options for the IotaRebasedNftConnector.
 */
export interface IIotaRebasedNftConnectorConstructorOptions {
	/**
	 * The configuration to use for the connector.
	 */
	config: IIotaRebasedNftConnectorConfig;

	/**
	 * The vault connector type to use.
	 * @default "vault"
	 */
	vaultConnectorType?: string;

	/**
	 * The logging connector type.
	 * @default logging
	 */
	loggingConnectorType?: string;
}
