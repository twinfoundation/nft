// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IRequestContext } from "@gtsc/services";

/**
 * Interface describing an NFT connector.
 */
export interface INftConnector {
	/**
	 * Mint an NFT.
	 * @param requestContext The context for the request.
	 * @param issuerAddress The issuer address for the NFT, will also be the owner address.
	 * @param tag The tag for the NFT.
	 * @param immutableMetadata The immutable metadata for the NFT.
	 * @param metadata The metadata for the NFT.
	 * @returns The id of the created NFT in urn format.
	 */
	mint<T = unknown, U = unknown>(
		requestContext: IRequestContext,
		issuerAddress: string,
		tag: string,
		immutableMetadata?: T,
		metadata?: U
	): Promise<string>;

	/**
	 * Resolve an NFT.
	 * @param requestContext The context for the request.
	 * @param id The id of the NFT to resolve.
	 * @returns The data for the NFT.
	 */
	resolve<T = unknown, U = unknown>(
		requestContext: IRequestContext,
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
	 * @param requestContext The context for the request.
	 * @param ownerAddress The issuer address for the NFT to return the funds to.
	 * @param id The id of the NFT to burn in urn format.
	 * @returns Nothing.
	 */
	burn(requestContext: IRequestContext, ownerAddress: string, id: string): Promise<void>;

	/**
	 * Transfer an NFT.
	 * @param requestContext The context for the request.
	 * @param id The id of the NFT to transfer in urn format.
	 * @param recipientAddress The recipient address of the NFT.
	 * @returns Nothing.
	 */
	transfer(requestContext: IRequestContext, id: string, recipientAddress: string): Promise<void>;
}
