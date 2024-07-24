// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Urn } from "@gtsc/core";
import type { IIrc27Metadata } from "@gtsc/nft-models";
import {
	TEST_BECH32_HRP,
	TEST_CLIENT_OPTIONS,
	TEST_COIN_TYPE,
	TEST_CONTEXT,
	TEST_IDENTITY_ID_2,
	TEST_MNEMONIC_NAME,
	TEST_NFT_ADDRESS_2_BECH32,
	TEST_NFT_ADDRESS_BECH32,
	setupTestEnv
} from "./setupTestEnv";
import { IotaNftConnector } from "../src/iotaNftConnector";
import { IotaNftUtils } from "../src/iotaNftUtils";

let nftId: string;

describe("IotaNftConnector", () => {
	beforeAll(async () => {
		await setupTestEnv();
	});

	test("Can mint an NFT", async () => {
		const connector = new IotaNftConnector({
			config: {
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				coinType: TEST_COIN_TYPE
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
		const idUrn = await connector.mint(
			TEST_NFT_ADDRESS_BECH32,
			"footag",
			immutableMetadata,
			{ bar: "foo" },
			TEST_CONTEXT
		);
		const urn = Urn.fromValidString(idUrn);

		const nftAddress = IotaNftUtils.nftIdToAddress(idUrn);
		console.debug("Minted NFT Id", idUrn.toString());
		console.debug("Minted NFT", `${process.env.TEST_EXPLORER_URL}addr/${nftAddress}`);
		expect(urn.namespaceIdentifier()).toEqual("nft");

		const specificParts = urn.namespaceSpecificParts();
		expect(specificParts[0]).toEqual("iota");
		expect(specificParts[1]).toEqual(TEST_BECH32_HRP);
		expect(specificParts[2].length).toEqual(66);

		nftId = idUrn;
	});

	test("Can resolve an NFT", async () => {
		const connector = new IotaNftConnector({
			config: {
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				coinType: TEST_COIN_TYPE
			}
		});
		const response = await connector.resolve(nftId, TEST_CONTEXT);

		expect(response.issuer).toEqual(TEST_NFT_ADDRESS_BECH32);
		expect(response.owner).toEqual(TEST_NFT_ADDRESS_BECH32);
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
		const connector = new IotaNftConnector({
			config: {
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				coinType: TEST_COIN_TYPE
			}
		});

		await connector.transfer(nftId, TEST_NFT_ADDRESS_2_BECH32, undefined, TEST_CONTEXT);

		const response = await connector.resolve(nftId, TEST_CONTEXT);

		expect(response.issuer).toEqual(TEST_NFT_ADDRESS_BECH32);
		expect(response.owner).toEqual(TEST_NFT_ADDRESS_2_BECH32);
	});

	test("Can return transfer an NFT", async () => {
		const connector = new IotaNftConnector({
			config: {
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				coinType: TEST_COIN_TYPE
			}
		});

		await connector.transfer(nftId, TEST_NFT_ADDRESS_BECH32, undefined, {
			partitionId: TEST_CONTEXT.partitionId,
			identity: TEST_IDENTITY_ID_2
		});

		const response = await connector.resolve(nftId, TEST_CONTEXT);

		expect(response.issuer).toEqual(TEST_NFT_ADDRESS_BECH32);
		expect(response.owner).toEqual(TEST_NFT_ADDRESS_BECH32);
	});

	test("Can transfer an NFT with a larger mutable payload", async () => {
		const connector = new IotaNftConnector({
			config: {
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				coinType: TEST_COIN_TYPE
			}
		});

		await connector.transfer(
			nftId,
			TEST_NFT_ADDRESS_2_BECH32,
			{
				payload: "a".repeat(128)
			},
			TEST_CONTEXT
		);

		const response = await connector.resolve(nftId, TEST_CONTEXT);

		expect(response.issuer).toEqual(TEST_NFT_ADDRESS_BECH32);
		expect(response.owner).toEqual(TEST_NFT_ADDRESS_2_BECH32);
	});

	test("Can update the mutable data of an NFT", async () => {
		const connector = new IotaNftConnector({
			config: {
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				coinType: TEST_COIN_TYPE
			}
		});
		await connector.update(
			nftId,
			{
				payload1: "a".repeat(128),
				payload2: "b".repeat(128),
				payload3: "c".repeat(128)
			},
			{
				partitionId: TEST_CONTEXT.partitionId,
				identity: TEST_IDENTITY_ID_2
			}
		);
	});

	test("Can fail to burn an NFT that has been transferred", async () => {
		const connector = new IotaNftConnector({
			config: {
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				coinType: TEST_COIN_TYPE
			}
		});
		await expect(
			connector.burn(TEST_NFT_ADDRESS_2_BECH32, nftId, TEST_CONTEXT)
		).rejects.toMatchObject({
			name: "GeneralError",
			message: "iotaNftConnector.burningFailed"
		});
	});

	test("Can burn an NFT", async () => {
		const connector = new IotaNftConnector({
			config: {
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				coinType: TEST_COIN_TYPE
			}
		});
		await connector.burn(TEST_NFT_ADDRESS_2_BECH32, nftId, {
			partitionId: TEST_CONTEXT.partitionId,
			identity: TEST_IDENTITY_ID_2
		});
	});
});
