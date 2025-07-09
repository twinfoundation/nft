// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Urn } from "@twin.org/core";
import type { MemoryEntityStorageConnector } from "@twin.org/entity-storage-connector-memory";
import { EntityStorageConnectorFactory } from "@twin.org/entity-storage-models";
import type { IIrc27Metadata } from "@twin.org/nft-models";
import { TEST_ADDRESS_2, TEST_IDENTITY_ID, TEST_IDENTITY_ID_2 } from "./setupTestEnv";
import type { Nft } from "../src/entities/nft";
import { EntityStorageNftConnector } from "../src/entityStorageNftConnector";

let nftId: string;

describe("EntityStorageNftConnector", () => {
	test("Can mint an NFT with no data", async () => {
		const connector = new EntityStorageNftConnector();
		const idUrn = await connector.mint(TEST_IDENTITY_ID, "footag");
		const urn = Urn.fromValidString(idUrn);

		expect(urn.namespaceIdentifier()).toEqual("nft");
		expect(urn.namespaceMethod()).toEqual("entity-storage");
		expect(urn.namespaceSpecific(1).length).toEqual(64);

		const store =
			EntityStorageConnectorFactory.get<MemoryEntityStorageConnector<Nft>>("nft").getStore();
		expect(store?.[0].id).toEqual(urn.namespaceSpecific(1));
		expect(store?.[0].owner).toEqual(TEST_IDENTITY_ID);
		expect(store?.[0].issuer).toEqual(TEST_IDENTITY_ID);
		expect(store?.[0].tag).toEqual("footag");
		expect(store?.[0].immutableMetadata).toEqual(undefined);
		expect(store?.[0].metadata).toEqual(undefined);

		await connector.burn(TEST_IDENTITY_ID, idUrn);
	});

	test("Can mint an NFT", async () => {
		const connector = new EntityStorageNftConnector();
		const immutableMetadata: IIrc27Metadata = {
			standard: "IRC27",
			version: "v1.0",
			type: "video/mp4",
			uri: "https://ipfs.io/ipfs/QmPoYcVm9fx47YXNTkhpMEYSxCD3Bqh7PJYr7eo5YjLgiT",
			name: "Test Name",
			collectionName: "Test Collection",
			issuerName: "Test Issuer",
			description: "Test Description"
		};
		const idUrn = await connector.mint(TEST_IDENTITY_ID, "footag", immutableMetadata, {
			bar: "foo"
		});
		const urn = Urn.fromValidString(idUrn);

		expect(urn.namespaceIdentifier()).toEqual("nft");
		expect(urn.namespaceMethod()).toEqual("entity-storage");
		expect(urn.namespaceSpecific(1).length).toEqual(64);

		const store =
			EntityStorageConnectorFactory.get<MemoryEntityStorageConnector<Nft>>("nft").getStore();
		expect(store?.[0].id).toEqual(urn.namespaceSpecific(1));
		expect(store?.[0].owner).toEqual(TEST_IDENTITY_ID);
		expect(store?.[0].issuer).toEqual(TEST_IDENTITY_ID);
		expect(store?.[0].tag).toEqual("footag");
		expect(store?.[0].immutableMetadata).toEqual(immutableMetadata);
		expect(store?.[0].metadata).toEqual({ bar: "foo" });

		nftId = idUrn;
	});

	test("Can resolve an NFT", async () => {
		const connector = new EntityStorageNftConnector();
		const response = await connector.resolve(nftId);

		expect(response.issuer).toEqual(TEST_IDENTITY_ID);
		expect(response.owner).toEqual(TEST_IDENTITY_ID);
		expect(response.tag).toEqual("footag");
		expect(response.metadata).toEqual({ bar: "foo" });
		expect(response.immutableMetadata).toEqual({
			standard: "IRC27",
			version: "v1.0",
			type: "video/mp4",
			uri: "https://ipfs.io/ipfs/QmPoYcVm9fx47YXNTkhpMEYSxCD3Bqh7PJYr7eo5YjLgiT",
			name: "Test Name",
			collectionName: "Test Collection",
			issuerName: "Test Issuer",
			description: "Test Description"
		});
	});

	test("Can transfer an NFT", async () => {
		const connector = new EntityStorageNftConnector();

		await connector.transfer(TEST_IDENTITY_ID, nftId, TEST_IDENTITY_ID_2, TEST_ADDRESS_2);

		const urn = Urn.fromValidString(nftId);

		const store =
			EntityStorageConnectorFactory.get<MemoryEntityStorageConnector<Nft>>("nft").getStore();
		expect(store?.[0].id).toEqual(urn.namespaceSpecific(1));
		expect(store?.[0].issuer).toEqual(TEST_IDENTITY_ID);
		expect(store?.[0].owner).toEqual(TEST_IDENTITY_ID_2);
	});

	test("Can burn an NFT", async () => {
		const connector = new EntityStorageNftConnector();
		await connector.burn(TEST_IDENTITY_ID, nftId);

		const store =
			EntityStorageConnectorFactory.get<MemoryEntityStorageConnector<Nft>>("nft").getStore();
		expect(store?.length).toEqual(0);
	});
});
