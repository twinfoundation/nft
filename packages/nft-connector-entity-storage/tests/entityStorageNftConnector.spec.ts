// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Urn } from "@gtsc/core";
import type { IIrc27Metadata } from "@gtsc/nft-models";
import {
	TEST_CONTEXT,
	TEST_IDENTITY_ID,
	TEST_IDENTITY_ID_2,
	TEST_NFT_STORAGE,
	TEST_TENANT_ID,
	TEST_VAULT_CONNECTOR
} from "./setupTestEnv";
import { EntityStorageNftConnector } from "../src/entityStorageNftConnector";

let nftId: string;

describe("EntityStorageNftConnector", () => {
	test("Can mint an NFT", async () => {
		const connector = new EntityStorageNftConnector(
			{
				vaultConnector: TEST_VAULT_CONNECTOR,
				nftEntityStorage: TEST_NFT_STORAGE
			},
			{}
		);
		const immutableMetadata: IIrc27Metadata = {
			standard: "IRC27",
			version: "v1.0",
			type: "video/mp4",
			uri: "https://ipfs.io/ipfs/QmPoYcVm9fx47YXNTkhpMEYSxCD3Bqh7PJYr7eo5YjLgiT",
			name: "Shimmer OG NFT",
			collectionName: "Test Collection",
			issuerName: "Test Issuer",
			description:
				"The Shimmer OG NFT was handed out 1337 times by the IOTA Foundation to celebrate the official launch of the Shimmer Network."
		};
		const idUrn = await connector.mint(TEST_CONTEXT, "footag", immutableMetadata, { bar: "foo" });
		const urn = Urn.fromValidString(idUrn);

		expect(urn.namespaceIdentifier()).toEqual("entity-storage-nft");
		expect(urn.namespaceSpecific().length).toEqual(66);

		const store = TEST_NFT_STORAGE.getStore(TEST_TENANT_ID);
		expect(store?.[0].id).toEqual(urn.namespaceSpecific());
		expect(store?.[0].owner).toEqual(TEST_IDENTITY_ID);
		expect(store?.[0].issuer).toEqual(TEST_IDENTITY_ID);
		expect(store?.[0].tag).toEqual("footag");
		expect(store?.[0].immutableMetadata).toEqual(JSON.stringify(immutableMetadata));
		expect(store?.[0].metadata).toEqual(JSON.stringify({ bar: "foo" }));

		nftId = idUrn;
	});

	test("Can transfer an NFT", async () => {
		const connector = new EntityStorageNftConnector(
			{
				vaultConnector: TEST_VAULT_CONNECTOR,
				nftEntityStorage: TEST_NFT_STORAGE
			},
			{}
		);

		await connector.transfer(TEST_CONTEXT, nftId, TEST_IDENTITY_ID_2);

		const urn = Urn.fromValidString(nftId);

		const store = TEST_NFT_STORAGE.getStore(TEST_TENANT_ID);
		expect(store?.[0].id).toEqual(urn.namespaceSpecific());
		expect(store?.[0].owner).toEqual(TEST_IDENTITY_ID_2);
		expect(store?.[0].issuer).toEqual(TEST_IDENTITY_ID);
	});

	test("Can fail to burn an NFT that has been transferred", async () => {
		const connector = new EntityStorageNftConnector(
			{
				vaultConnector: TEST_VAULT_CONNECTOR,
				nftEntityStorage: TEST_NFT_STORAGE
			},
			{}
		);
		await expect(connector.burn(TEST_CONTEXT, nftId)).rejects.toMatchObject({
			name: "GeneralError",
			message: "entityStorageNftConnector.burningFailed"
		});

		const urn = Urn.fromValidString(nftId);

		const store = TEST_NFT_STORAGE.getStore(TEST_TENANT_ID);
		expect(store?.[0].id).toEqual(urn.namespaceSpecific());
		expect(store?.[0].owner).toEqual(TEST_IDENTITY_ID_2);
		expect(store?.[0].issuer).toEqual(TEST_IDENTITY_ID);
	});

	test("Can burn an NFT", async () => {
		const connector = new EntityStorageNftConnector(
			{
				vaultConnector: TEST_VAULT_CONNECTOR,
				nftEntityStorage: TEST_NFT_STORAGE
			},
			{}
		);
		await connector.burn(
			{
				tenantId: TEST_TENANT_ID,
				identity: TEST_IDENTITY_ID_2
			},
			nftId
		);

		const store = TEST_NFT_STORAGE.getStore(TEST_TENANT_ID);
		expect(store?.length).toEqual(0);
	});
});
