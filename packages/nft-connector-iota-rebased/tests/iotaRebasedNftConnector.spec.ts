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
	TEST_MNEMONIC_NAME
} from "./setupTestEnv";
import { IotaRebasedNftConnector } from "../src/iotaRebasedNftConnector";

let nftId: string;
let nftDeployerConnector: IotaRebasedNftConnector;
let nftUserConnector: IotaRebasedNftConnector;

/*
 * TODO
 * These tests use a wait for resolution due to known latency issues with the Indexer.
 * The current checkpoint-based synchronization introduces delays, causing read-after-write consistency to fail in certain cases. This results in intermittent test failures.
 * Once the latency issues are resolved, the wait can be removed.
 */

/**
 * Wait for the NFT to be resolved.
 * @param resolveId The NFT ID.
 */
async function waitForResolution(resolveId: string): Promise<void> {
	for (let i = 0; i < 50; i++) {
		try {
			await nftUserConnector.resolve(resolveId);
			return;
		} catch {}
		await new Promise(resolve => setTimeout(resolve, 100));
	}

	// eslint-disable-next-line no-restricted-syntax
	throw new Error("NFT resolution failed");
}

/**
 * Wait for the NFT to fail resolved.
 * @param resolveId The NFT ID.
 */
async function waitForFailedResolution(resolveId: string): Promise<void> {
	for (let i = 0; i < 50; i++) {
		try {
			await nftUserConnector.resolve(resolveId);
		} catch {
			return;
		}
		await new Promise(resolve => setTimeout(resolve, 100));
	}

	// eslint-disable-next-line no-restricted-syntax
	throw new Error("NFT resolution still working");
}

/**
 * Wait for the owner to be change.
 * @param id The NFT ID.
 * @param newOwner The new owner.
 */
async function waitForOwnerChange(id: string, newOwner: string): Promise<void> {
	for (let i = 0; i < 50; i++) {
		try {
			const resolved = await nftUserConnector.resolve(id);
			if (resolved.owner === newOwner) {
				return;
			}
		} catch {}
		await new Promise(resolve => setTimeout(resolve, 100));
	}

	// eslint-disable-next-line no-restricted-syntax
	throw new Error("NFT owner change failed");
}

/**
 * Wait for the NFT to have specific field in the data.
 * @param resolveId The NFT ID.
 * @param expectedData Data to look for.
 */
async function waitForData(resolveId: string, expectedData: unknown): Promise<void> {
	for (let i = 0; i < 50; i++) {
		try {
			const data = await nftUserConnector.resolve(resolveId);
			if (JSON.stringify(data.metadata) === JSON.stringify(expectedData)) {
				return;
			}
		} catch {}
		await new Promise(resolve => setTimeout(resolve, 100));
	}

	// eslint-disable-next-line no-restricted-syntax
	throw new Error("NFT data lookup failed");
}

describe("IotaRebasedNftConnector", () => {
	beforeAll(async () => {
		await setupTestEnv();
		// Connector for deployment (using node/deployer mnemonic)
		nftDeployerConnector = new IotaRebasedNftConnector({
			config: {
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				network: TEST_NETWORK
			}
		});
		// Deploy the Move contract
		await nftDeployerConnector.start(TEST_NODE_IDENTITY);
		// Create connector for user operations
		nftUserConnector = new IotaRebasedNftConnector({
			config: {
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				network: TEST_NETWORK
			}
		});
		await nftUserConnector.start(TEST_NODE_IDENTITY);
	});

	test("Cannot mint an NFT before start", async () => {
		const unstartedConnector = new IotaRebasedNftConnector({
			config: {
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				network: TEST_NETWORK
			}
		});
		await expect(
			unstartedConnector.mint(TEST_USER_IDENTITY_ID, TEST_ADDRESS, "test_tag")
		).rejects.toThrow("connectorNotStarted");
	});

	test("Can mint an NFT", async () => {
		const immutableMetadata = {
			name: "Test NFT",
			description: "This is a test NFT",
			uri: "https://example.com/nft.png"
		};
		const tag = "test_tag";
		nftId = await nftUserConnector.mint(
			TEST_USER_IDENTITY_ID,
			TEST_ADDRESS,
			tag,
			immutableMetadata,
			{
				customField: "customValue"
			}
		);
		const urn = Urn.fromValidString(nftId);
		expect(urn.namespaceIdentifier()).toEqual("nft");
		const specificParts = urn.namespaceSpecificParts();
		expect(specificParts[0]).toEqual("iota-rebased");
		expect(specificParts[1]).toEqual(TEST_NETWORK);
		expect(specificParts[2].length).toBeGreaterThan(0);
		expect(specificParts[3].length).toBeGreaterThan(0);
		await waitForResolution(nftId);
	});

	test("Can resolve an NFT", async () => {
		const response = await nftUserConnector.resolve(nftId);
		expect(response.issuer).toEqual(TEST_ADDRESS);
		expect(response.owner).toEqual(TEST_ADDRESS);
		expect(response.tag).toEqual("test_tag");
		expect(response.metadata).toEqual({ customField: "customValue" });
		expect(response.immutableMetadata).toEqual({
			name: "Test NFT",
			description: "This is a test NFT",
			uri: "https://example.com/nft.png"
		});
	});

	test("Can transfer an NFT", async () => {
		await nftUserConnector.transfer(TEST_USER_IDENTITY_ID, nftId, TEST_ADDRESS_2);
		await waitForOwnerChange(nftId, TEST_ADDRESS_2);
		const response = await nftUserConnector.resolve(nftId);
		expect(response.issuer).toEqual(TEST_ADDRESS);
		expect(response.owner).toEqual(TEST_ADDRESS_2);
	});

	test("Can transfer an NFT back to the original owner", async () => {
		await nftUserConnector.transfer(TEST_USER_IDENTITY_ID_2, nftId, TEST_ADDRESS);
		await waitForOwnerChange(nftId, TEST_ADDRESS);
		const response = await nftUserConnector.resolve(nftId);
		expect(response.issuer).toEqual(TEST_ADDRESS);
		expect(response.owner).toEqual(TEST_ADDRESS);
	});

	test("Throws error when unauthorized user attempts to transfer NFT", async () => {
		await expect(
			nftUserConnector.transfer("unauthorizedController", nftId, TEST_ADDRESS_2)
		).rejects.toThrow("transferFailed");
	});

	test("Can update the mutable data of an NFT", async () => {
		await nftUserConnector.update(TEST_USER_IDENTITY_ID, nftId, {
			updatedField: "newValue",
			anotherField: "anotherValue"
		});
		await waitForData(nftId, {
			updatedField: "newValue",
			anotherField: "anotherValue"
		});
		const response = await nftUserConnector.resolve(nftId);
		expect(response.metadata).toEqual({
			updatedField: "newValue",
			anotherField: "anotherValue"
		});
	});

	test("Can burn an NFT", async () => {
		await nftUserConnector.burn(TEST_USER_IDENTITY_ID, nftId);
		await waitForFailedResolution(nftId);
		await expect(nftUserConnector.resolve(nftId)).rejects.toThrow();
	});

	test("Cannot transfer a burned NFT", async () => {
		const burnTestNftId = await nftUserConnector.mint(
			TEST_USER_IDENTITY_ID,
			TEST_ADDRESS,
			"burn_test"
		);
		await waitForResolution(burnTestNftId);
		await nftUserConnector.burn(TEST_USER_IDENTITY_ID, burnTestNftId);
		await expect(
			nftUserConnector.transfer(TEST_USER_IDENTITY_ID, burnTestNftId, TEST_ADDRESS_2)
		).rejects.toThrow("transferFailed");
	});

	test("Can burn an NFT on a transferred address", async () => {
		const burnTestNftId = await nftUserConnector.mint(
			TEST_USER_IDENTITY_ID,
			TEST_ADDRESS,
			"burn_test"
		);
		await waitForResolution(burnTestNftId);
		await nftUserConnector.transfer(TEST_USER_IDENTITY_ID, burnTestNftId, TEST_ADDRESS_2);
		await waitForOwnerChange(burnTestNftId, TEST_ADDRESS_2);
		await nftUserConnector.burn(TEST_USER_IDENTITY_ID_2, burnTestNftId);
		await waitForFailedResolution(burnTestNftId);
	});

	test("Can mint an NFT with complex metadata", async () => {
		const immutableMetadata = {
			name: "Complex NFT",
			description: "NFT with complex metadata",
			uri: "https://example.com/nft.png"
		};
		const complexMetadata = {
			level1: {
				level2: {
					key: "value"
				}
			}
		};
		nftId = await nftUserConnector.mint(
			TEST_USER_IDENTITY_ID,
			TEST_ADDRESS,
			"complex_tag",
			immutableMetadata,
			complexMetadata
		);
		await waitForResolution(nftId);
		const response = await nftUserConnector.resolve(nftId);
		expect(response.metadata).toEqual(complexMetadata);
	});
});
