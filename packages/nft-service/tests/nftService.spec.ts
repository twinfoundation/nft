// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { EntityStorageNftConnector } from "@gtsc/nft-connector-entity-storage";
import { NftConnectorFactory } from "@gtsc/nft-models";
import { NftService } from "../src/nftService";

describe("NftService", () => {
	test("Can create an instance", async () => {
		NftConnectorFactory.register(
			EntityStorageNftConnector.NAMESPACE,
			() => new EntityStorageNftConnector()
		);
		const service = new NftService();
		expect(service).toBeDefined();
	});
});
