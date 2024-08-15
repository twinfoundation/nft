// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IComponent } from "@gtsc/core";

/**
 * Interface describing an NFT component.
 */
export interface INftComponent extends IComponent {
	/**
	 * Mint an NFT.
	 * @param issuer The issuer for the NFT, will also be the initial owner.
	 * @param tag The tag for the NFT.
	 * @param immutableMetadata The immutable metadata for the NFT.
	 * @param metadata The metadata for the NFT.
	 * @param namespace The namespace of the connector to use for the NFT, defaults to component configured namespace.
	 * @param identity The identity to perform the nft operation on.
	 * @returns The id of the created NFT in urn format.
	 */
	mint<T = unknown, U = unknown>(
		issuer: string,
		tag: string,
		immutableMetadata?: T,
		metadata?: U,
		namespace?: string,
		identity?: string
	): Promise<string>;

	/**
	 * Resolve an NFT.
	 * @param id The id of the NFT to resolve.
	 * @param identity The identity to perform the nft operation on.
	 * @returns The data for the NFT.
	 */
	resolve<T = unknown, U = unknown>(
		id: string,
		identity?: string
	): Promise<{
		issuer: string;
		owner: string;
		tag: string;
		immutableMetadata?: T;
		metadata?: U;
	}>;

	/**
	 * Burn an NFT.
	 * @param id The id of the NFT to burn in urn format.
	 * @param identity The identity to perform the nft operation on.
	 * @returns Nothing.
	 */
	burn(id: string, identity?: string): Promise<void>;

	/**
	 * Transfer an NFT.
	 * @param id The id of the NFT to transfer in urn format.
	 * @param recipient The recipient of the NFT.
	 * @param metadata Optional mutable data to include during the transfer.
	 * @param identity The identity to perform the nft operation on.
	 * @returns Nothing.
	 */
	transfer<T = unknown>(
		id: string,
		recipient: string,
		metadata?: T,
		identity?: string
	): Promise<void>;

	/**
	 * Update the mutable data of the NFT.
	 * @param id The id of the NFT to update in urn format.
	 * @param metadata The mutable data to update.
	 * @param identity The identity to perform the nft operation on.
	 * @returns Nothing.
	 */
	update<T = unknown>(id: string, metadata: T, identity?: string): Promise<void>;
}
