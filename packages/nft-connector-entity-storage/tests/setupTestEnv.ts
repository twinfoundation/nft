// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import path from "node:path";
import { MemoryEntityStorageConnector } from "@twin.org/entity-storage-connector-memory";
import { EntityStorageConnectorFactory } from "@twin.org/entity-storage-models";
import { nameof } from "@twin.org/nameof";
import * as dotenv from "dotenv";
import type { Nft } from "../src/entities/nft";
import { initSchema } from "../src/schema";

console.debug("Setting up test environment from .env and .env.dev files");

dotenv.config({ path: [path.join(__dirname, ".env"), path.join(__dirname, ".env.dev")] });

export const TEST_IDENTITY_ID = "test-identity";
export const TEST_IDENTITY_ID_2 = "test-identity-2";

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
