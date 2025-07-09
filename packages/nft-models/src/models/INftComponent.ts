// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IComponent } from "@twin.org/core";

/**
 * Interface describing an NFT component.
 */
export interface INftComponent extends IComponent {
	/**
	 * Mint an NFT.
	 * @param tag The tag for the NFT.
	 * @param immutableMetadata The immutable metadata for the NFT.
	 * @param metadata The metadata for the NFT.
	 * @param namespace The namespace of the connector to use for the NFT, defaults to component configured namespace.
	 * @param identity The identity to perform the nft operation on.
	 * @returns The id of the created NFT in urn format.
	 */
	mint<T = unknown, U = unknown>(
		tag: string,
		immutableMetadata?: T,
		metadata?: U,
		namespace?: string,
		identity?: string
	): Promise<string>;

	/**
	 * Resolve an NFT.
	 * @param id The id of the NFT to resolve.
	 * @param controllerIdentity The identity to perform the nft operation on.
	 * @returns The data for the NFT.
	 */
	resolve<T = unknown, U = unknown>(
		id: string,
		controllerIdentity?: string
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
	 * @param controllerIdentity The identity to perform the nft operation on.
	 * @returns Nothing.
	 */
	burn(id: string, controllerIdentity?: string): Promise<void>;

	/**
	 * Transfer an NFT.
	 * @param id The id of the NFT to transfer in urn format.
	 * @param recipientIdentity The recipient identity for the NFT.
	 * @param recipientAddress The recipient address for the NFT.
	 * @param metadata Optional mutable data to include during the transfer.
	 * @param controllerIdentity The identity to perform the nft operation on.
	 * @returns Nothing.
	 */
	transfer<U = unknown>(
		id: string,
		recipientIdentity: string,
		recipientAddress: string,
		metadata?: U,
		controllerIdentity?: string
	): Promise<void>;

	/**
	 * Update the mutable data of the NFT.
	 * @param id The id of the NFT to update in urn format.
	 * @param metadata The mutable data to update.
	 * @param controllerIdentity The identity to perform the nft operation on.
	 * @returns Nothing.
	 */
	update<U = unknown>(id: string, metadata: U, controllerIdentity?: string): Promise<void>;
}
