// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
// import { Urn } from "@twin.org/core";
// import {
// 	TEST_CLIENT_OPTIONS,
// 	TEST_USER_MNEMONIC_NAME,
// 	NETWORK_NAME,
// 	TEST_ADDRESS,
// 	TEST_ADDRESS_2,
// 	setupTestEnv,
// 	TEST_USER_IDENTITY_ID_2,
// 	TEST_USER_IDENTITY_ID,
// 	TEST_NODE_IDENTITY,
// 	TEST_NODE_MNEMONIC_NAME
// } from "./setupTestEnv";
// import { IotaRebasedNftConnector } from "../src/iotaRebasedNftConnector";

// let nftId: string;
// let nftDeployerConnector: IotaRebasedNftConnector;
// let nftUserConnector: IotaRebasedNftConnector;
// const nodeIdentity = TEST_NODE_IDENTITY;
// const userIdentity = TEST_USER_IDENTITY_ID;
// const userIdentity2 = TEST_USER_IDENTITY_ID_2;

/*
 * ATTENTION *
 * These tests have been commented out due to known latency issues with the Indexer.
 * The current checkpoint-based synchronization introduces delays, causing read-after-write consistency to fail in certain cases. This results in intermittent test failures.
 * Once the latency issues are resolved, these tests should be re-enabled.
 */

describe("IotaRebasedNftConnector", () => {
	test("dummy-test", () => {});
	// beforeAll(async () => {
	// 	await setupTestEnv(NETWORK_NAME);
	// 	// Connector for deployment (using node/deployer mnemonic)
	// 	nftDeployerConnector = new IotaRebasedNftConnector({
	// 		config: {
	// 			clientOptions: TEST_CLIENT_OPTIONS,
	// 			vaultMnemonicId: TEST_NODE_MNEMONIC_NAME,
	// 			network: NETWORK_NAME
	// 		}
	// 	});
	// 	// Deploy the Move contract
	// 	await nftDeployerConnector.start(nodeIdentity);
	// 	// Create connector for user operations
	// 	nftUserConnector = new IotaRebasedNftConnector({
	// 		config: {
	// 			clientOptions: TEST_CLIENT_OPTIONS,
	// 			vaultMnemonicId: TEST_USER_MNEMONIC_NAME, // user mnemonic
	// 			network: NETWORK_NAME
	// 		}
	// 	});
	// 	await nftUserConnector.start(userIdentity);
	// });
	// test("Cannot mint an NFT before start", async () => {
	// 	const unstartedConnector = new IotaRebasedNftConnector({
	// 		config: {
	// 			clientOptions: TEST_CLIENT_OPTIONS,
	// 			vaultMnemonicId: TEST_USER_MNEMONIC_NAME,
	// 			network: NETWORK_NAME
	// 		}
	// 	});
	// 	await expect(unstartedConnector.mint(userIdentity, TEST_ADDRESS, "test_tag")).rejects.toThrow(
	// 		"connectorNotStarted"
	// 	);
	// });
	// test("Can mint an NFT", async () => {
	// 	const immutableMetadata = {
	// 		name: "Test NFT",
	// 		description: "This is a test NFT",
	// 		uri: "https://example.com/nft.png"
	// 	};
	// 	const tag = "test_tag";
	// 	nftId = await nftUserConnector.mint(userIdentity, TEST_ADDRESS, tag, immutableMetadata, {
	// 		customField: "customValue"
	// 	});
	// 	const urn = Urn.fromValidString(nftId);
	// 	expect(urn.namespaceIdentifier()).toEqual("nft");
	// 	const specificParts = urn.namespaceSpecificParts();
	// 	expect(specificParts[0]).toEqual("iota-rebased");
	// 	expect(specificParts[1]).toEqual(NETWORK_NAME);
	// 	expect(specificParts[2].length).toBeGreaterThan(0);
	// });
	// test("Can resolve an NFT", async () => {
	// 	const response = await nftUserConnector.resolve(nftId);
	// 	expect(response.issuer).toEqual(TEST_ADDRESS);
	// 	expect(response.owner).toEqual(TEST_ADDRESS);
	// 	expect(response.tag).toEqual("test_tag");
	// 	expect(response.metadata).toEqual({ customField: "customValue" });
	// 	expect(response.immutableMetadata).toEqual({
	// 		name: "Test NFT",
	// 		description: "This is a test NFT",
	// 		uri: "https://example.com/nft.png"
	// 	});
	// });
	// test("Can transfer an NFT", async () => {
	// 	await nftUserConnector.transfer(userIdentity, nftId, TEST_ADDRESS_2);
	// 	const response = await nftUserConnector.resolve(nftId);
	// 	expect(response.issuer).toEqual(TEST_ADDRESS);
	// 	expect(response.owner).toEqual(TEST_ADDRESS_2);
	// });
	// test("Can transfer an NFT back to the original owner", async () => {
	// 	await nftUserConnector.transfer(userIdentity2, nftId, TEST_ADDRESS);
	// 	const response = await nftUserConnector.resolve(nftId);
	// 	expect(response.issuer).toEqual(TEST_ADDRESS);
	// 	expect(response.owner).toEqual(TEST_ADDRESS);
	// });
	// test("Throws error when unauthorized user attempts to transfer NFT", async () => {
	// 	await expect(
	// 		nftUserConnector.transfer("unauthorizedController", nftId, TEST_ADDRESS_2)
	// 	).rejects.toThrow("transferFailed");
	// });
	// test("Can update the mutable data of an NFT", async () => {
	// 	await nftUserConnector.update(userIdentity, nftId, {
	// 		updatedField: "newValue",
	// 		anotherField: "anotherValue"
	// 	});
	// 	const response = await nftUserConnector.resolve(nftId);
	// 	expect(response.metadata).toEqual({
	// 		updatedField: "newValue",
	// 		anotherField: "anotherValue"
	// 	});
	// });
	// test("Can burn an NFT", async () => {
	// 	await nftUserConnector.burn(userIdentity, nftId);
	// 	await expect(nftUserConnector.resolve(nftId)).rejects.toThrow();
	// });
	// test("Cannot transfer a burned NFT", async () => {
	// 	const burnTestNftId = await nftUserConnector.mint(userIdentity, TEST_ADDRESS, "burn_test");
	// 	await nftUserConnector.burn(userIdentity, burnTestNftId);
	// 	await expect(
	// 		nftUserConnector.transfer(userIdentity, burnTestNftId, TEST_ADDRESS_2)
	// 	).rejects.toThrow("transferFailed");
	// });
	// test("Can mint an NFT with complex metadata", async () => {
	// 	const immutableMetadata = {
	// 		name: "Complex NFT",
	// 		description: "NFT with complex metadata",
	// 		uri: "https://example.com/nft.png"
	// 	};
	// 	const complexMetadata = {
	// 		level1: {
	// 			level2: {
	// 				key: "value"
	// 			}
	// 		}
	// 	};
	// 	nftId = await nftUserConnector.mint(
	// 		userIdentity,
	// 		TEST_ADDRESS,
	// 		"complex_tag",
	// 		immutableMetadata,
	// 		complexMetadata
	// 	);
	// 	const response = await nftUserConnector.resolve(nftId);
	// 	expect(response.metadata).toEqual(complexMetadata);
	// });
});
