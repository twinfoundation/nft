// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Urn } from "@twin.org/core";
import {
	TEST_CLIENT_OPTIONS,
	TEST_ADDRESS,
	TEST_ADDRESS_2,
	setupTestEnv,
	TEST_USER_IDENTITY_ID_2,
	TEST_USER_IDENTITY_ID,
	TEST_NODE_IDENTITY,
	TEST_NETWORK,
	TEST_MNEMONIC_NAME,
	TEST_VAULT_CONNECTOR,
	TEST_EXPLORER_URL
} from "./setupTestEnv";
import { IotaNftConnector } from "../src/iotaNftConnector";

let nftId: string;
let nftConnector: IotaNftConnector;

describe("IotaNftConnector", () => {
	beforeAll(async () => {
		await setupTestEnv();
		// Connector for deployment (using node/deployer mnemonic)
		nftConnector = new IotaNftConnector({
			config: {
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				network: TEST_NETWORK,
				enableCostLogging: true
			}
		});
		// Deploy the Move contract
		const componentState: { contractDeployments?: { [id: string]: string } } = {};
		await nftConnector.start(TEST_NODE_IDENTITY, undefined, componentState);
		console.debug("Component State", componentState);

		const keys = Object.keys(componentState.contractDeployments ?? {});
		console.debug(
			"Deployed contract",
			`${TEST_EXPLORER_URL}object/${componentState.contractDeployments?.[keys[0]]}?network=${TEST_NETWORK}`
		);
	});

	test("Cannot mint an NFT before start", async () => {
		const unstartedConnector = new IotaNftConnector({
			config: {
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				network: TEST_NETWORK
			}
		});
		await expect(unstartedConnector.mint(TEST_USER_IDENTITY_ID, "test_tag")).rejects.toThrow(
			"connectorNotStarted"
		);
	});

	test("Can mint an NFT with no data", async () => {
		const tag = "test_tag";
		nftId = await nftConnector.mint(TEST_USER_IDENTITY_ID, tag);
		const urn = Urn.fromValidString(nftId);
		expect(urn.namespaceIdentifier()).toEqual("nft");
		const specificParts = urn.namespaceSpecificParts();
		expect(specificParts[0]).toEqual("iota");
		expect(specificParts[1]).toEqual(TEST_NETWORK);
		expect(specificParts[2].length).toBeGreaterThan(0);
		expect(specificParts[3].length).toBeGreaterThan(0);
		const response = await nftConnector.resolve(nftId);
		expect(response.issuer).toEqual(TEST_USER_IDENTITY_ID);
		expect(response.owner).toEqual(TEST_USER_IDENTITY_ID);
		expect(response.immutableMetadata).toBeUndefined();

		console.debug(
			"Created",
			`${TEST_EXPLORER_URL}object/${specificParts[3]}?network=${TEST_NETWORK}`
		);
	});

	test("Can mint an NFT", async () => {
		const immutableMetadata = {
			name: "Test NFT",
			description: "This is a test NFT",
			uri: "https://example.com/nft.png"
		};
		const tag = "test_tag";
		nftId = await nftConnector.mint(TEST_USER_IDENTITY_ID, tag, immutableMetadata, {
			customField: "customValue"
		});
		const urn = Urn.fromValidString(nftId);
		expect(urn.namespaceIdentifier()).toEqual("nft");
		const specificParts = urn.namespaceSpecificParts();
		expect(specificParts[0]).toEqual("iota");
		expect(specificParts[1]).toEqual(TEST_NETWORK);
		expect(specificParts[2].length).toBeGreaterThan(0);
		expect(specificParts[3].length).toBeGreaterThan(0);
		const response = await nftConnector.resolve(nftId);
		expect(response.issuer).toEqual(TEST_USER_IDENTITY_ID);
		expect(response.owner).toEqual(TEST_USER_IDENTITY_ID);

		console.debug(
			"Created",
			`${TEST_EXPLORER_URL}object/${specificParts[3]}?network=${TEST_NETWORK}`
		);
	});

	test("Can resolve an NFT", async () => {
		const response = await nftConnector.resolve(nftId);
		expect(response.issuer).toEqual(TEST_USER_IDENTITY_ID);
		expect(response.owner).toEqual(TEST_USER_IDENTITY_ID);
		expect(response.tag).toEqual("test_tag");
		expect(response.metadata).toEqual({ customField: "customValue" });
		expect(response.immutableMetadata).toEqual({
			name: "Test NFT",
			description: "This is a test NFT",
			uri: "https://example.com/nft.png"
		});
	});

	test("Can transfer an NFT", async () => {
		await nftConnector.transfer(
			TEST_USER_IDENTITY_ID,
			nftId,
			TEST_USER_IDENTITY_ID_2,
			TEST_ADDRESS_2
		);

		const response = await nftConnector.resolve(nftId);
		expect(response.issuer).toEqual(TEST_USER_IDENTITY_ID);
		expect(response.owner).toEqual(TEST_USER_IDENTITY_ID_2);

		const urn = Urn.fromValidString(nftId);
		expect(urn.namespaceIdentifier()).toEqual("nft");
		const specificParts = urn.namespaceSpecificParts();
		console.debug(
			"Created",
			`${TEST_EXPLORER_URL}object/${specificParts[3]}?network=${TEST_NETWORK}`
		);
	});

	test("Can transfer an NFT back to the original owner", async () => {
		await nftConnector.transfer(
			TEST_USER_IDENTITY_ID_2,
			nftId,
			TEST_USER_IDENTITY_ID,
			TEST_ADDRESS
		);

		const response = await nftConnector.resolve(nftId);
		expect(response.issuer).toEqual(TEST_USER_IDENTITY_ID);
		expect(response.owner).toEqual(TEST_USER_IDENTITY_ID);

		const urn = Urn.fromValidString(nftId);
		expect(urn.namespaceIdentifier()).toEqual("nft");
		const specificParts = urn.namespaceSpecificParts();
		console.debug(
			"Created",
			`${TEST_EXPLORER_URL}object/${specificParts[3]}?network=${TEST_NETWORK}`
		);
	});

	test("Can transfer an NFT with metadata update", async () => {
		const testNftId = await nftConnector.mint(
			TEST_USER_IDENTITY_ID,
			"transfer_test",
			{
				name: "Transfer Test NFT",
				description: "NFT for testing transfer with metadata",
				uri: "https://example.com/transfer.png"
			},
			{ initialField: "initialValue" }
		);

		// Prepare new metadata for transfer
		const transferMetadata = {
			updatedField: "transferValue",
			timestamp: Date.now(),
			transferInfo: { previousOwner: TEST_ADDRESS, transferDate: new Date().toISOString() }
		};

		// Transfer with metadata update
		await nftConnector.transfer(
			TEST_USER_IDENTITY_ID,
			testNftId,
			TEST_USER_IDENTITY_ID_2,
			TEST_ADDRESS_2,
			transferMetadata
		);

		const response = await nftConnector.resolve(testNftId);
		expect(response.owner).toEqual(TEST_USER_IDENTITY_ID_2);
		expect(response.metadata).toEqual(transferMetadata);
		expect(response.issuer).toEqual(TEST_USER_IDENTITY_ID); // Issuer should remain unchanged

		const urn = Urn.fromValidString(nftId);
		expect(urn.namespaceIdentifier()).toEqual("nft");
		const specificParts = urn.namespaceSpecificParts();
		console.debug(
			"Created",
			`${TEST_EXPLORER_URL}object/${specificParts[3]}?network=${TEST_NETWORK}`
		);
	});

	test("Throws error when unauthorized user attempts to transfer NFT", async () => {
		await TEST_VAULT_CONNECTOR.setSecret(
			`unauthorizedController/${TEST_MNEMONIC_NAME}`,
			process.env.TEST_NODE_MNEMONIC
		);

		await expect(
			nftConnector.transfer(
				"unauthorizedController",
				nftId,
				TEST_USER_IDENTITY_ID_2,
				TEST_ADDRESS_2
			)
		).rejects.toThrow("transferFailed");
	});

	test("Can update the mutable data of an NFT", async () => {
		await nftConnector.update(TEST_USER_IDENTITY_ID, nftId, {
			updatedField: "newValue",
			anotherField: "anotherValue"
		});

		const response = await nftConnector.resolve(nftId);
		expect(response.metadata).toEqual({ updatedField: "newValue", anotherField: "anotherValue" });

		const urn = Urn.fromValidString(nftId);
		expect(urn.namespaceIdentifier()).toEqual("nft");
		const specificParts = urn.namespaceSpecificParts();
		console.debug(
			"Created",
			`${TEST_EXPLORER_URL}object/${specificParts[3]}?network=${TEST_NETWORK}`
		);
	});

	test("Can burn an NFT", async () => {
		await nftConnector.burn(TEST_USER_IDENTITY_ID, nftId);
		await expect(nftConnector.resolve(nftId)).rejects.toThrow();
	});

	test("Cannot transfer a burned NFT", async () => {
		const burnTestNftId = await nftConnector.mint(TEST_USER_IDENTITY_ID, TEST_ADDRESS, "burn_test");

		await nftConnector.burn(TEST_USER_IDENTITY_ID, burnTestNftId);
		await expect(
			nftConnector.transfer(
				TEST_USER_IDENTITY_ID,
				burnTestNftId,
				TEST_USER_IDENTITY_ID_2,
				TEST_ADDRESS_2
			)
		).rejects.toThrow("transferFailed");
	});

	test("Can burn an NFT on a transferred address", async () => {
		const burnTestNftId = await nftConnector.mint(TEST_USER_IDENTITY_ID, TEST_ADDRESS, "burn_test");

		await nftConnector.transfer(
			TEST_USER_IDENTITY_ID,
			burnTestNftId,
			TEST_USER_IDENTITY_ID_2,
			TEST_ADDRESS_2
		);
		await nftConnector.burn(TEST_USER_IDENTITY_ID_2, burnTestNftId);
	});

	test("Can mint an NFT with complex metadata", async () => {
		const immutableMetadata = {
			name: "Complex NFT",
			description: "NFT with complex metadata",
			uri: "https://example.com/nft.png"
		};
		const complexMetadata = { level1: { level2: { key: "value" } } };
		nftId = await nftConnector.mint(
			TEST_USER_IDENTITY_ID,
			"complex_tag",
			immutableMetadata,
			complexMetadata
		);

		const response = await nftConnector.resolve(nftId);
		expect(response.metadata).toEqual(complexMetadata);

		const urn = Urn.fromValidString(nftId);
		expect(urn.namespaceIdentifier()).toEqual("nft");
		const specificParts = urn.namespaceSpecificParts();
		console.debug(
			"Created",
			`${TEST_EXPLORER_URL}object/${specificParts[3]}?network=${TEST_NETWORK}`
		);
	});
});
