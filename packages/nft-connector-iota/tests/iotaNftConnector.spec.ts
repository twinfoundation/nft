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
	TEST_VAULT_CONNECTOR,
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
		const connector = new IotaNftConnector(
			{
				vaultConnector: TEST_VAULT_CONNECTOR
			},
			{
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				coinType: TEST_COIN_TYPE
			}
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
		const idUrn = await connector.mint(
			TEST_CONTEXT,
			TEST_NFT_ADDRESS_BECH32,
			"footag",
			immutableMetadata,
			{ bar: "foo" }
		);
		const urn = Urn.fromValidString(idUrn);

		const nftAddress = IotaNftUtils.nftIdToAddress(idUrn);
		console.debug("Minted NFT Id", idUrn.toString());
		console.debug("Minted NFT", `${process.env.TEST_EXPLORER_URL}addr/${nftAddress}`);
		expect(urn.namespaceIdentifier()).toEqual("iota-nft");

		const specificParts = urn.namespaceSpecific().split(":");
		expect(specificParts[0]).toEqual(TEST_BECH32_HRP);
		expect(specificParts[1].length).toEqual(66);

		nftId = idUrn;
	});

	test("Can transfer an NFT", async () => {
		const connector = new IotaNftConnector(
			{
				vaultConnector: TEST_VAULT_CONNECTOR
			},
			{
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				coinType: TEST_COIN_TYPE
			}
		);

		await connector.transfer(TEST_CONTEXT, nftId, TEST_NFT_ADDRESS_2_BECH32);
	});

	test("Can fail to burn an NFT that has been transferred", async () => {
		const connector = new IotaNftConnector(
			{
				vaultConnector: TEST_VAULT_CONNECTOR
			},
			{
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				coinType: TEST_COIN_TYPE
			}
		);
		await expect(
			connector.burn(TEST_CONTEXT, TEST_NFT_ADDRESS_BECH32, nftId)
		).rejects.toMatchObject({
			name: "GeneralError",
			message: "iotaNftConnector.burningFailed"
		});
	});

	test("Can burn an NFT", async () => {
		const connector = new IotaNftConnector(
			{
				vaultConnector: TEST_VAULT_CONNECTOR
			},
			{
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				coinType: TEST_COIN_TYPE
			}
		);
		await connector.burn(
			{
				tenantId: TEST_CONTEXT.tenantId,
				identity: TEST_IDENTITY_ID_2
			},
			TEST_NFT_ADDRESS_2_BECH32,
			nftId
		);
	});
});
