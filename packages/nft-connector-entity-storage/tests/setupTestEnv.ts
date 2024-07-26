// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import path from "node:path";
import { MemoryEntityStorageConnector } from "@gtsc/entity-storage-connector-memory";
import { EntityStorageConnectorFactory } from "@gtsc/entity-storage-models";
import { nameof } from "@gtsc/nameof";
import type { IServiceRequestContext } from "@gtsc/services";
import * as dotenv from "dotenv";
import type { Nft } from "../src/entities/nft";
import { initSchema } from "../src/schema";

console.debug("Setting up test environment from .env and .env.dev files");

dotenv.config({ path: [path.join(__dirname, ".env"), path.join(__dirname, ".env.dev")] });

export const TEST_PARTITION_ID = "test-partition";
export const TEST_IDENTITY_ID = "test-identity";

export const TEST_ADDRESS_1 = "test-address-1";
export const TEST_ADDRESS_2 = "test-address-2";

initSchema();

EntityStorageConnectorFactory.register(
	"nft",
	() =>
		new MemoryEntityStorageConnector<Nft>({
			entitySchema: nameof<Nft>()
		})
);

export const TEST_CONTEXT: IServiceRequestContext = {
	partitionId: TEST_PARTITION_ID,
	userIdentity: TEST_IDENTITY_ID
};
