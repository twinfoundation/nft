// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IComponent } from "@gtsc/core";

/**
 * Interface describing an NFT connector.
 */
export interface INftConnector extends IComponent {
	/**
	 * Mint an NFT.
	 * @param controller The identity of the user to access the vault keys.
	 * @param issuerAddress The issuer for the NFT, will also be the initial owner.
	 * @param tag The tag for the NFT.
	 * @param immutableMetadata The immutable metadata for the NFT.
	 * @param metadata The metadata for the NFT.
	 * @returns The id of the created NFT in urn format.
	 */
	mint<T = unknown, U = unknown>(
		controller: string,
		issuerAddress: string,
		tag: string,
		immutableMetadata?: T,
		metadata?: U
	): Promise<string>;

	/**
	 * Resolve an NFT.
	 * @param id The id of the NFT to resolve.
	 * @returns The data for the NFT.
	 */
	resolve<T = unknown, U = unknown>(
		id: string
	): Promise<{
		issuer: string;
		owner: string;
		tag: string;
		immutableMetadata?: T;
		metadata?: U;
	}>;

	/**
	 * Burn an NFT.
	 * @param controller The controller of the NFT who can make changes.
	 * @param id The id of the NFT to burn in urn format.
	 * @returns Nothing.
	 */
	burn(controller: string, id: string): Promise<void>;

	/**
	 * Transfer an NFT.
	 * @param controller The controller of the NFT who can make changes.
	 * @param id The id of the NFT to transfer in urn format.
	 * @param recipient The recipient of the NFT.
	 * @param metadata Optional mutable data to include during the transfer.
	 * @returns Nothing.
	 */
	transfer<T = unknown>(
		controller: string,
		id: string,
		recipient: string,
		metadata?: T
	): Promise<void>;

	/**
	 * Update the mutable data of the NFT.
	 * @param controller The controller of the NFT who can make changes.
	 * @param id The id of the NFT to update in urn format.
	 * @param metadata The mutable data to update.
	 * @returns Nothing.
	 */
	update<T = unknown>(controller: string, id: string, metadata: T): Promise<void>;
}
