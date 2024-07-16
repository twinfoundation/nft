// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Urn } from "@gtsc/core";
import type { MemoryEntityStorageConnector } from "@gtsc/entity-storage-connector-memory";
import { EntityStorageConnectorFactory } from "@gtsc/entity-storage-models";
import type { IIrc27Metadata } from "@gtsc/nft-models";
import {
	TEST_ADDRESS_1,
	TEST_ADDRESS_2,
	TEST_CONTEXT,
	TEST_IDENTITY_ID,
	TEST_PARTITION_ID
} from "./setupTestEnv";
import type { Nft } from "../src/entities/nft";
import { EntityStorageNftConnector } from "../src/entityStorageNftConnector";

let nftId: string;

describe("EntityStorageNftConnector", () => {
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
		const idUrn = await connector.mint(
			TEST_ADDRESS_1,
			"footag",
			immutableMetadata,
			{
				bar: "foo"
			},
			TEST_CONTEXT
		);
		const urn = Urn.fromValidString(idUrn);

		expect(urn.namespaceIdentifier()).toEqual("entity-storage-nft");
		expect(urn.namespaceSpecific().length).toEqual(66);

		const store =
			EntityStorageConnectorFactory.get<MemoryEntityStorageConnector<Nft>>("nft").getStore(
				TEST_PARTITION_ID
			);
		expect(store?.[0].id).toEqual(urn.namespaceSpecific());
		expect(store?.[0].owner).toEqual(TEST_ADDRESS_1);
		expect(store?.[0].issuer).toEqual(TEST_ADDRESS_1);
		expect(store?.[0].tag).toEqual("footag");
		expect(store?.[0].immutableMetadata).toEqual(JSON.stringify(immutableMetadata));
		expect(store?.[0].metadata).toEqual(JSON.stringify({ bar: "foo" }));

		nftId = idUrn;
	});

	test("Can resolve an NFT", async () => {
		const connector = new EntityStorageNftConnector();
		const response = await connector.resolve(nftId, {
			partitionId: TEST_CONTEXT.partitionId,
			identity: TEST_IDENTITY_ID
		});

		expect(response.issuer).toEqual(TEST_ADDRESS_1);
		expect(response.owner).toEqual(TEST_ADDRESS_1);
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

		await connector.transfer(nftId, TEST_ADDRESS_2, undefined, TEST_CONTEXT);

		const urn = Urn.fromValidString(nftId);

		const store =
			EntityStorageConnectorFactory.get<MemoryEntityStorageConnector<Nft>>("nft").getStore(
				TEST_PARTITION_ID
			);
		expect(store?.[0].id).toEqual(urn.namespaceSpecific());
		expect(store?.[0].owner).toEqual(TEST_ADDRESS_2);
		expect(store?.[0].issuer).toEqual(TEST_ADDRESS_1);
	});

	test("Can fail to burn an NFT that has been transferred", async () => {
		const connector = new EntityStorageNftConnector();
		await expect(connector.burn(TEST_ADDRESS_1, nftId, TEST_CONTEXT)).rejects.toMatchObject({
			name: "GeneralError",
			message: "entityStorageNftConnector.burningFailed"
		});

		const urn = Urn.fromValidString(nftId);

		const store =
			EntityStorageConnectorFactory.get<MemoryEntityStorageConnector<Nft>>("nft").getStore(
				TEST_PARTITION_ID
			);
		expect(store?.[0].id).toEqual(urn.namespaceSpecific());
		expect(store?.[0].owner).toEqual(TEST_ADDRESS_2);
		expect(store?.[0].issuer).toEqual(TEST_ADDRESS_1);
	});

	test("Can burn an NFT", async () => {
		const connector = new EntityStorageNftConnector();
		await connector.burn(TEST_ADDRESS_2, nftId, {
			partitionId: TEST_PARTITION_ID,
			identity: TEST_IDENTITY_ID
		});

		const store =
			EntityStorageConnectorFactory.get<MemoryEntityStorageConnector<Nft>>("nft").getStore(
				TEST_PARTITION_ID
			);
		expect(store?.length).toEqual(0);
	});
});
