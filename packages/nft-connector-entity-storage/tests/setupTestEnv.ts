// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import path from "node:path";
import { EntitySchemaHelper } from "@gtsc/entity";
import { MemoryEntityStorageConnector } from "@gtsc/entity-storage-connector-memory";
import type { IRequestContext } from "@gtsc/services";
import * as dotenv from "dotenv";
import { Nft } from "../src/entities/nft";

console.debug("Setting up test environment from .env and .env.dev files");

dotenv.config({ path: [path.join(__dirname, ".env"), path.join(__dirname, ".env.dev")] });

export const TEST_TENANT_ID = "test-tenant";
export const TEST_IDENTITY_ID = "test-identity";

export const TEST_ADDRESS_1 = "test-address-1";
export const TEST_ADDRESS_2 = "test-address-2";

export const TEST_NFT_STORAGE = new MemoryEntityStorageConnector<Nft>(
	EntitySchemaHelper.getSchema(Nft)
);

export const TEST_CONTEXT: IRequestContext = {
	tenantId: TEST_TENANT_ID,
	identity: TEST_IDENTITY_ID
};
