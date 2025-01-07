// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { INftServiceConfig } from "./INftServiceConfig";

/**
 * Options for the nft service constructor.
 */
export interface INftServiceConstructorOptions {
	/**
	 * The configuration for the service.
	 */
	config?: INftServiceConfig;
}
