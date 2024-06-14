// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { entity, property } from "@gtsc/entity";

/**
 * Class describing the nft.
 */
@entity()
export class Nft {
	/**
	 * The identity of the nft.
	 */
	@property({ type: "string", isPrimary: true })
	public id!: string;

	/**
	 * The address of the issuer.
	 */
	@property({ type: "string" })
	public issuerAddress!: string;

	/**
	 * The address of the owner.
	 */
	@property({ type: "string" })
	public ownerAddress!: string;

	/**
	 * The tag for the nft.
	 */
	@property({ type: "string" })
	public tag!: string;

	/**
	 * The JSON stringified version of the immutable metadata.
	 */
	@property({ type: "string" })
	public immutableMetadata!: string;

	/**
	 * The JSON stringified version of the mutable metadata.
	 */
	@property({ type: "string" })
	public metadata!: string;
}
