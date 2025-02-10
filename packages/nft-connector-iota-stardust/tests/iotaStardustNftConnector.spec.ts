// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Urn } from "@twin.org/core";
import type { IIrc27Metadata } from "@twin.org/nft-models";
import {
	TEST_BECH32_HRP,
	TEST_CLIENT_OPTIONS,
	TEST_COIN_TYPE,
	TEST_IDENTITY_ID,
	TEST_IDENTITY_ID_2,
	TEST_MNEMONIC_NAME,
	TEST_NFT_ADDRESS_2_BECH32,
	TEST_NFT_ADDRESS_BECH32,
	TEST_WALLET_ADDRESS_INDEX,
	setupTestEnv
} from "./setupTestEnv";
import { IotaStardustNftConnector } from "../src/iotaStardustNftConnector";
import { IotaStardustNftUtils } from "../src/iotaStardustNftUtils";

let nftId: string;

describe("IotaNftConnector", () => {
	beforeAll(async () => {
		await setupTestEnv();
	});

	test("Can mint an NFT with no data", async () => {
		const connector = new IotaStardustNftConnector({
			config: {
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				coinType: TEST_COIN_TYPE,
				walletAddressIndex: TEST_WALLET_ADDRESS_INDEX
			}
		});
		const idUrn = await connector.mint(TEST_IDENTITY_ID, "footag");
		const urn = Urn.fromValidString(idUrn);

		const nftAddress = IotaStardustNftUtils.nftIdToAddress(idUrn);
		console.debug("Minted NFT Id", idUrn.toString());
		console.debug("Minted NFT", `${process.env.TEST_EXPLORER_URL}addr/${nftAddress}`);
		expect(urn.namespaceIdentifier()).toEqual("nft");

		const specificParts = urn.namespaceSpecificParts();
		expect(specificParts[0]).toEqual("iota-stardust");
		expect(specificParts[1]).toEqual(TEST_BECH32_HRP);
		expect(specificParts[2].length).toEqual(66);
	});

	test("Can mint an NFT", async () => {
		const connector = new IotaStardustNftConnector({
			config: {
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				coinType: TEST_COIN_TYPE,
				walletAddressIndex: TEST_WALLET_ADDRESS_INDEX
			}
		});
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

		const nftAddress = IotaStardustNftUtils.nftIdToAddress(idUrn);
		console.debug("Minted NFT Id", idUrn.toString());
		console.debug("Minted NFT", `${process.env.TEST_EXPLORER_URL}addr/${nftAddress}`);
		expect(urn.namespaceIdentifier()).toEqual("nft");

		const specificParts = urn.namespaceSpecificParts();
		expect(specificParts[0]).toEqual("iota-stardust");
		expect(specificParts[1]).toEqual(TEST_BECH32_HRP);
		expect(specificParts[2].length).toEqual(66);

		nftId = idUrn;
	});

	test("Can resolve an NFT", async () => {
		const connector = new IotaStardustNftConnector({
			config: {
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				coinType: TEST_COIN_TYPE
			}
		});
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
		const connector = new IotaStardustNftConnector({
			config: {
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				coinType: TEST_COIN_TYPE
			}
		});

		await connector.transfer(
			TEST_IDENTITY_ID,
			nftId,
			TEST_IDENTITY_ID_2,
			TEST_NFT_ADDRESS_2_BECH32
		);

		const response = await connector.resolve(nftId);

		expect(response.issuer).toEqual(TEST_IDENTITY_ID);
		expect(response.owner).toEqual(TEST_IDENTITY_ID_2);
	});

	test("Can return transfer an NFT", async () => {
		const connector = new IotaStardustNftConnector({
			config: {
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				coinType: TEST_COIN_TYPE
			}
		});

		await connector.transfer(TEST_IDENTITY_ID_2, nftId, TEST_IDENTITY_ID, TEST_NFT_ADDRESS_BECH32);

		const response = await connector.resolve(nftId);

		expect(response.issuer).toEqual(TEST_IDENTITY_ID);
		expect(response.owner).toEqual(TEST_IDENTITY_ID);
	});

	test("Can transfer an NFT with a larger mutable payload", async () => {
		const connector = new IotaStardustNftConnector({
			config: {
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				coinType: TEST_COIN_TYPE
			}
		});

		await connector.transfer(
			TEST_IDENTITY_ID,
			nftId,
			TEST_IDENTITY_ID_2,
			TEST_NFT_ADDRESS_2_BECH32,
			{
				payload: "a".repeat(128)
			}
		);

		const response = await connector.resolve(nftId);

		expect(response.issuer).toEqual(TEST_IDENTITY_ID);
		expect(response.owner).toEqual(TEST_IDENTITY_ID_2);
		expect(response.metadata).toEqual({
			payload: "a".repeat(128)
		});
	});

	test("Can update the mutable data of an NFT", async () => {
		const connector = new IotaStardustNftConnector({
			config: {
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				coinType: TEST_COIN_TYPE
			}
		});
		await connector.update(TEST_IDENTITY_ID_2, nftId, {
			payload1: "a".repeat(128),
			payload2: "b".repeat(128),
			payload3: "c".repeat(128)
		});

		const response = await connector.resolve(nftId);

		expect(response.issuer).toEqual(TEST_IDENTITY_ID);
		expect(response.owner).toEqual(TEST_IDENTITY_ID_2);
		expect(response.metadata).toEqual({
			payload1: "a".repeat(128),
			payload2: "b".repeat(128),
			payload3: "c".repeat(128)
		});
	});

	test("Can burn an NFT", async () => {
		const connector = new IotaStardustNftConnector({
			config: {
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				coinType: TEST_COIN_TYPE
			}
		});
		await connector.burn(TEST_IDENTITY_ID_2, nftId);
	});
});
