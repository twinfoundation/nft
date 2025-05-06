// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { MemoryEntityStorageConnector } from "@twin.org/entity-storage-connector-memory";
import { EntityStorageConnectorFactory } from "@twin.org/entity-storage-models";
import { nameof } from "@twin.org/nameof";
import { IotaNftConnector } from "@twin.org/nft-connector-iota";
import type { INftConnector } from "@twin.org/nft-models";
import {
	EntityStorageVaultConnector,
	type VaultKey,
	type VaultSecret,
	initSchema
} from "@twin.org/vault-connector-entity-storage";
import { VaultConnectorFactory } from "@twin.org/vault-models";
import { NftConnectorTypes } from "../models/nftConnectorTypes";

/**
 * Setup the vault for use in the CLI commands.
 */
export function setupVault(): void {
	initSchema();

	EntityStorageConnectorFactory.register(
		"vault-key",
		() =>
			new MemoryEntityStorageConnector<VaultKey>({
				entitySchema: nameof<VaultKey>()
			})
	);
	EntityStorageConnectorFactory.register(
		"vault-secret",
		() =>
			new MemoryEntityStorageConnector<VaultSecret>({
				entitySchema: nameof<VaultSecret>()
			})
	);

	const vaultConnector = new EntityStorageVaultConnector();
	VaultConnectorFactory.register("vault", () => vaultConnector);
}

/**
 * Setup the NFT connector for use in the CLI commands.
 * @param options The options for the NFT connector.
 * @param options.nodeEndpoint The node endpoint.
 * @param options.network The network.
 * @param options.vaultSeedId The vault seed ID.
 * @param options.walletAddressIndex The wallet address index.
 * @param connector The connector to use.
 * @returns The NFT connector.
 */
export function setupNftConnector(
	options: {
		nodeEndpoint: string;
		network?: string;
		vaultSeedId?: string;
		walletAddressIndex?: number;
	},
	connector?: NftConnectorTypes
): INftConnector {
	connector ??= NftConnectorTypes.Iota;

	return new IotaNftConnector({
		config: {
			clientOptions: {
				url: options.nodeEndpoint
			},
			network: options.network ?? "",
			vaultSeedId: options.vaultSeedId,
			walletAddressIndex: options.walletAddressIndex ?? 0
		}
	});
}
