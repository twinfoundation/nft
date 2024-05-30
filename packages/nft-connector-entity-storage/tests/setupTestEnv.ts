// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import path from "node:path";
import { EntitySchemaHelper } from "@gtsc/entity";
import { MemoryEntityStorageConnector } from "@gtsc/entity-storage-connector-memory";
import type { IRequestContext } from "@gtsc/services";
import {
	EntityStorageVaultConnector,
	VaultKey,
	VaultSecret
} from "@gtsc/vault-connector-entity-storage";
import type { IVaultConnector } from "@gtsc/vault-models";
import * as dotenv from "dotenv";
import { Nft } from "../src/entities/nft";

console.log("Setting up test environment from .env and .env.dev files");

dotenv.config({ path: [path.join(__dirname, ".env"), path.join(__dirname, ".env.dev")] });

export const TEST_TENANT_ID = "test-tenant";
export const TEST_IDENTITY_ID = "test-identity";
export const TEST_IDENTITY_ID_2 = "test-identity-2";

export const TEST_VAULT_KEY_STORAGE = new MemoryEntityStorageConnector<VaultKey>(
	EntitySchemaHelper.getSchema(VaultKey)
);

export const TEST_VAULT_SECRET_STORAGE = new MemoryEntityStorageConnector<VaultSecret>(
	EntitySchemaHelper.getSchema(VaultSecret)
);

export const TEST_VAULT_CONNECTOR: IVaultConnector = new EntityStorageVaultConnector({
	vaultKeyEntityStorageConnector: TEST_VAULT_KEY_STORAGE,
	vaultSecretEntityStorageConnector: TEST_VAULT_SECRET_STORAGE
});

export const TEST_NFT_STORAGE = new MemoryEntityStorageConnector<Nft>(
	EntitySchemaHelper.getSchema(Nft)
);

export const TEST_CONTEXT: IRequestContext = {
	tenantId: TEST_TENANT_ID,
	identity: TEST_IDENTITY_ID
};
