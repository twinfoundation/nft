// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { HttpStatusCodes } from "@gtsc/web";

/**
 * The response when creating the NFT.
 */
export interface INftMintResponse {
	/**
	 * Response status code.
	 */
	statusCode: HttpStatusCodes;

	/**
	 * The result of the mint process.
	 */
	headers: {
		Location: string;
	};
}
