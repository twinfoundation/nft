// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { entity, property } from "@twin.org/entity";

/**
 * Class describing the nft.
 */
@entity()
export class Nft {
	/**
	 * The identity of the NFT.
	 */
	@property({ type: "string", isPrimary: true })
	public id!: string;

	/**
	 * The issuer of the NFT.
	 */
	@property({ type: "string" })
	public issuer!: string;

	/**
	 * The owner of the NFT.
	 */
	@property({ type: "string" })
	public owner!: string;

	/**
	 * The tag for the nft.
	 */
	@property({ type: "string" })
	public tag!: string;

	/**
	 * The immutable metadata.
	 */
	@property({ type: "object", optional: true })
	public immutableMetadata?: unknown;

	/**
	 * The mutable metadata.
	 */
	@property({ type: "object", optional: true })
	public metadata?: unknown;
}
