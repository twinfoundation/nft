// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IClientOptions } from "@iota/sdk-wasm/node/lib/index.js";

/**
 * Configuration for the IOTA NFT connector.
 */
export interface IIotaNftConnectorConfig {
	/**
	 * The configuration for the client.
	 */
	clientOptions: IClientOptions;

	/**
	 * The id of the entry in the vault containing the wallet mnemonic.
	 * @default wallet-mnemonic
	 */
	walletMnemonicId?: string;

	/**
	 * The address index of the account to use for storing identities.
	 * @default 2
	 */
	addressIndex?: number;

	/**
	 * The coin type.
	 * @default IOTA 4218
	 */
	coinType?: number;

	/**
	 * The length of time to wait for the inclusion of a transaction in seconds.
	 * @default 60
	 */
	inclusionTimeoutSeconds?: number;
}
