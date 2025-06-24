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
	TEST_EXPLORER_URL,
	GAS_STATION_URL,
	GAS_STATION_AUTH_TOKEN,
	GAS_BUDGET
} from "./setupTestEnv";
import { IotaNftConnector } from "../src/iotaNftConnector";
import type { IIotaNftConnectorConfig } from "../src/models/IIotaNftConnectorConfig";

let nftId: string;
let gasStationNftConnector: IotaNftConnector;
let regularNftConnector: IotaNftConnector;

describe("IotaNftConnector with Gas Station", () => {
	let gasStationConfig: IIotaNftConnectorConfig;
	let regularConfig: IIotaNftConnectorConfig;

	beforeAll(async () => {
		await setupTestEnv();

		// Gas station configuration
		gasStationConfig = {
			clientOptions: TEST_CLIENT_OPTIONS,
			vaultMnemonicId: TEST_MNEMONIC_NAME,
			network: TEST_NETWORK,
			gasBudget: GAS_BUDGET,
			enableCostLogging: true,
			gasStation: {
				gasStationUrl: GAS_STATION_URL,
				gasStationAuthToken: GAS_STATION_AUTH_TOKEN
			}
		};

		// Regular configuration (without gas station)
		regularConfig = {
			clientOptions: TEST_CLIENT_OPTIONS,
			vaultMnemonicId: TEST_MNEMONIC_NAME,
			network: TEST_NETWORK,
			enableCostLogging: true
		};

		// Connector for deployment with gas station (using node/deployer mnemonic)
		gasStationNftConnector = new IotaNftConnector({
			config: gasStationConfig
		});

		// Regular connector for comparison
		regularNftConnector = new IotaNftConnector({
			config: regularConfig
		});

		// Deploy the Move contract using gas station
		const componentState: { contractDeployments?: { [id: string]: string } } = {};
		await gasStationNftConnector.start(TEST_NODE_IDENTITY, undefined, componentState);
		console.debug("Component State (Gas Station)", componentState);

		const keys = Object.keys(componentState.contractDeployments ?? {});
		console.debug(
			"Deployed contract with gas station",
			`${TEST_EXPLORER_URL}object/${componentState.contractDeployments?.[keys[0]]}?network=${TEST_NETWORK}`
		);
	});

	describe("Configuration", () => {
		test("Should create NFT connector with gas station configuration", () => {
			const connector = new IotaNftConnector({
				config: gasStationConfig
			});

			expect(connector).toBeDefined();
			expect(connector.CLASS_NAME).toBe("IotaNftConnector");
		});

		test("Should create NFT connector without gas station configuration", () => {
			const connector = new IotaNftConnector({
				config: regularConfig
			});

			expect(connector).toBeDefined();
			expect(connector.CLASS_NAME).toBe("IotaNftConnector");
		});

		test("Should create NFT connector with custom gas budget", () => {
			const customGasBudgetConfig: IIotaNftConnectorConfig = {
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				network: TEST_NETWORK,
				gasBudget: GAS_BUDGET * 2, // Double the default gas budget
				gasStation: {
					gasStationUrl: GAS_STATION_URL,
					gasStationAuthToken: GAS_STATION_AUTH_TOKEN
				}
			};

			const connector = new IotaNftConnector({
				config: customGasBudgetConfig
			});

			expect(connector).toBeDefined();
			expect(connector.CLASS_NAME).toBe("IotaNftConnector");
		});
	});

	describe("Gas Station Integration", () => {
		test("Should test gas station connectivity before attempting NFT operations", async () => {
			await expect(fetch(GAS_STATION_URL, { method: "GET" })).resolves.toMatchObject({
				ok: true
			});
		}, 10000);

		test("Cannot mint an NFT before start (gas station)", async () => {
			const unstartedConnector = new IotaNftConnector({
				config: gasStationConfig
			});
			await expect(unstartedConnector.mint(TEST_USER_IDENTITY_ID, "test_tag")).rejects.toThrow(
				"connectorNotStarted"
			);
		});

		test("Can mint an NFT with no data using gas station", async () => {
			const tag = "gas_station_test_tag";
			nftId = await gasStationNftConnector.mint(TEST_USER_IDENTITY_ID, tag);
			const urn = Urn.fromValidString(nftId);
			expect(urn.namespaceIdentifier()).toEqual("nft");
			const specificParts = urn.namespaceSpecificParts();
			expect(specificParts[0]).toEqual("iota");
			expect(specificParts[1]).toEqual(TEST_NETWORK);
			expect(specificParts[2].length).toBeGreaterThan(0);
			expect(specificParts[3].length).toBeGreaterThan(0);
			const response = await gasStationNftConnector.resolve(nftId);
			expect(response.issuer).toEqual(TEST_USER_IDENTITY_ID);
			expect(response.owner).toEqual(TEST_USER_IDENTITY_ID);
			expect(response.immutableMetadata).toBeUndefined();

			console.debug(
				"Created with gas station",
				`${TEST_EXPLORER_URL}object/${specificParts[3]}?network=${TEST_NETWORK}`
			);
		}, 30000);

		test("Can mint an NFT using gas station", async () => {
			const immutableMetadata = {
				name: "Gas Station Test NFT",
				description: "This is a test NFT created using gas station",
				uri: "https://example.com/gas-station-nft.png"
			};
			const tag = "gas_station_full_test";
			nftId = await gasStationNftConnector.mint(TEST_USER_IDENTITY_ID, tag, immutableMetadata, {
				gasStationField: "gasStationValue",
				sponsoredTransaction: true
			});
			const urn = Urn.fromValidString(nftId);
			expect(urn.namespaceIdentifier()).toEqual("nft");
			const specificParts = urn.namespaceSpecificParts();
			expect(specificParts[0]).toEqual("iota");
			expect(specificParts[1]).toEqual(TEST_NETWORK);
			expect(specificParts[2].length).toBeGreaterThan(0);
			expect(specificParts[3].length).toBeGreaterThan(0);
			const response = await gasStationNftConnector.resolve(nftId);
			expect(response.issuer).toEqual(TEST_USER_IDENTITY_ID);
			expect(response.owner).toEqual(TEST_USER_IDENTITY_ID);

			console.debug(
				"Created with gas station",
				`${TEST_EXPLORER_URL}object/${specificParts[3]}?network=${TEST_NETWORK}`
			);
		}, 30000);
		test("Should compare regular vs gas station minting", async () => {
			// Start the regular connector first (deploy contract without gas station)
			const regularComponentState: { contractDeployments?: { [id: string]: string } } = {};
			await regularNftConnector.start(TEST_NODE_IDENTITY, undefined, regularComponentState);

			// Mint with regular connector
			const regularNftId = await regularNftConnector.mint(
				TEST_USER_IDENTITY_ID,
				"regular_comparison",
				{
					name: "Regular NFT",
					description: "NFT minted without gas station",
					uri: "https://example.com/regular.png"
				},
				{ type: "regular" }
			);

			// Mint with gas station connector
			const gasStationNftId = await gasStationNftConnector.mint(
				TEST_USER_IDENTITY_ID,
				"gasstation_comparison",
				{
					name: "Gas Station NFT",
					description: "NFT minted with gas station",
					uri: "https://example.com/gasstation.png"
				},
				{ type: "gasStation" }
			);

			expect(regularNftId).toBeDefined();
			expect(gasStationNftId).toBeDefined();
			expect(regularNftId).not.toBe(gasStationNftId);

			// Both should resolve successfully
			const regularNft = await regularNftConnector.resolve(regularNftId);
			const gasStationNft = await gasStationNftConnector.resolve(gasStationNftId);

			expect((regularNft.metadata as { type: string }).type).toBe("regular");
			expect((gasStationNft.metadata as { type: string }).type).toBe("gasStation");
		}, 60000);
	});

	describe("NFT Operations with Gas Station", () => {
		test("Can resolve an NFT created with gas station", async () => {
			const response = await gasStationNftConnector.resolve(nftId);
			expect(response.issuer).toEqual(TEST_USER_IDENTITY_ID);
			expect(response.owner).toEqual(TEST_USER_IDENTITY_ID);
			expect(response.tag).toEqual("gas_station_full_test");
			expect(response.metadata).toEqual({
				gasStationField: "gasStationValue",
				sponsoredTransaction: true
			});
			expect(response.immutableMetadata).toEqual({
				name: "Gas Station Test NFT",
				description: "This is a test NFT created using gas station",
				uri: "https://example.com/gas-station-nft.png"
			});
		});

		test("Can transfer an NFT using gas station", async () => {
			await gasStationNftConnector.transfer(
				TEST_USER_IDENTITY_ID,
				nftId,
				TEST_USER_IDENTITY_ID_2,
				TEST_ADDRESS_2
			);

			const response = await gasStationNftConnector.resolve(nftId);
			expect(response.issuer).toEqual(TEST_USER_IDENTITY_ID);
			expect(response.owner).toEqual(TEST_USER_IDENTITY_ID_2);

			const urn = Urn.fromValidString(nftId);
			expect(urn.namespaceIdentifier()).toEqual("nft");
			const specificParts = urn.namespaceSpecificParts();
			console.debug(
				"Transferred with gas station",
				`${TEST_EXPLORER_URL}object/${specificParts[3]}?network=${TEST_NETWORK}`
			);
		}, 30000);

		test("Can transfer an NFT back to original owner using gas station", async () => {
			await gasStationNftConnector.transfer(
				TEST_USER_IDENTITY_ID_2,
				nftId,
				TEST_USER_IDENTITY_ID,
				TEST_ADDRESS
			);

			const response = await gasStationNftConnector.resolve(nftId);
			expect(response.issuer).toEqual(TEST_USER_IDENTITY_ID);
			expect(response.owner).toEqual(TEST_USER_IDENTITY_ID);

			const urn = Urn.fromValidString(nftId);
			expect(urn.namespaceIdentifier()).toEqual("nft");
			const specificParts = urn.namespaceSpecificParts();
			console.debug(
				"Transferred back with gas station",
				`${TEST_EXPLORER_URL}object/${specificParts[3]}?network=${TEST_NETWORK}`
			);
		}, 30000);

		test("Can transfer an NFT with metadata update using gas station", async () => {
			const testNftId = await gasStationNftConnector.mint(
				TEST_USER_IDENTITY_ID,
				"gas_station_transfer_test",
				{
					name: "Gas Station Transfer Test NFT",
					description: "NFT for testing transfer with metadata using gas station",
					uri: "https://example.com/gas-station-transfer.png"
				},
				{ initialField: "initialValue", gasStationCreated: true }
			);

			// Prepare new metadata for transfer
			const transferMetadata = {
				updatedField: "gasStationTransferValue",
				timestamp: Date.now(),
				transferInfo: {
					previousOwner: TEST_ADDRESS,
					transferDate: new Date().toISOString(),
					sponsoredTransfer: true
				}
			};

			// Transfer with metadata update using gas station
			await gasStationNftConnector.transfer(
				TEST_USER_IDENTITY_ID,
				testNftId,
				TEST_USER_IDENTITY_ID_2,
				TEST_ADDRESS_2,
				transferMetadata
			);

			const response = await gasStationNftConnector.resolve(testNftId);
			expect(response.owner).toEqual(TEST_USER_IDENTITY_ID_2);
			expect(response.metadata).toEqual(transferMetadata);
			expect(response.issuer).toEqual(TEST_USER_IDENTITY_ID); // Issuer should remain unchanged

			const urn = Urn.fromValidString(testNftId);
			expect(urn.namespaceIdentifier()).toEqual("nft");
			const specificParts = urn.namespaceSpecificParts();
			console.debug(
				"Transfer with metadata update using gas station",
				`${TEST_EXPLORER_URL}object/${specificParts[3]}?network=${TEST_NETWORK}`
			);
		}, 60000);

		test("Can update the mutable data of an NFT using gas station", async () => {
			await gasStationNftConnector.update(TEST_USER_IDENTITY_ID, nftId, {
				updatedField: "gasStationNewValue",
				anotherField: "anotherGasStationValue",
				gasStationUpdate: true,
				updateTimestamp: Date.now()
			});

			const response = await gasStationNftConnector.resolve(nftId);
			expect(response.metadata).toEqual({
				updatedField: "gasStationNewValue",
				anotherField: "anotherGasStationValue",
				gasStationUpdate: true,
				updateTimestamp: expect.any(Number)
			});

			const urn = Urn.fromValidString(nftId);
			expect(urn.namespaceIdentifier()).toEqual("nft");
			const specificParts = urn.namespaceSpecificParts();
			console.debug(
				"Updated with gas station",
				`${TEST_EXPLORER_URL}object/${specificParts[3]}?network=${TEST_NETWORK}`
			);
		}, 30000);

		test("Can burn an NFT using gas station", async () => {
			await gasStationNftConnector.burn(TEST_USER_IDENTITY_ID, nftId);
			await expect(gasStationNftConnector.resolve(nftId)).rejects.toThrow();
		}, 30000);

		test("Can burn an NFT on a transferred address using gas station", async () => {
			const burnTestNftId = await gasStationNftConnector.mint(
				TEST_USER_IDENTITY_ID,
				"gas_station_burn_test"
			);

			await gasStationNftConnector.transfer(
				TEST_USER_IDENTITY_ID,
				burnTestNftId,
				TEST_USER_IDENTITY_ID_2,
				TEST_ADDRESS_2
			);
			await gasStationNftConnector.burn(TEST_USER_IDENTITY_ID_2, burnTestNftId);
		}, 60000);

		test("Can mint an NFT with complex metadata using gas station", async () => {
			const immutableMetadata = {
				name: "Complex Gas Station NFT",
				description: "NFT with complex metadata using gas station",
				uri: "https://example.com/complex-gas-station-nft.png"
			};
			const complexMetadata = {
				level1: {
					level2: {
						key: "gasStationValue",
						sponsoredTransaction: true,
						gasStationComplexData: {
							array: [1, 2, 3],
							nested: { deep: "value" }
						}
					}
				}
			};
			const complexNftId = await gasStationNftConnector.mint(
				TEST_USER_IDENTITY_ID,
				"gas_station_complex_tag",
				immutableMetadata,
				complexMetadata
			);

			const response = await gasStationNftConnector.resolve(complexNftId);
			expect(response.metadata).toEqual(complexMetadata);

			const urn = Urn.fromValidString(complexNftId);
			expect(urn.namespaceIdentifier()).toEqual("nft");
			const specificParts = urn.namespaceSpecificParts();
			console.debug(
				"Complex NFT created with gas station",
				`${TEST_EXPLORER_URL}object/${specificParts[3]}?network=${TEST_NETWORK}`
			);
		}, 30000);
	});

	describe("Gas Station Error Handling", () => {
		test("Should handle gas station unavailable gracefully", async () => {
			const invalidGasStationConfig: IIotaNftConnectorConfig = {
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				network: TEST_NETWORK,
				gasStation: {
					gasStationUrl: "http://localhost:9999", // Invalid port
					gasStationAuthToken: GAS_STATION_AUTH_TOKEN
				}
			};

			const connector = new IotaNftConnector({
				config: invalidGasStationConfig
			});

			// Deploy first using regular transaction (no gas station for deployment)
			const componentState: { contractDeployments?: { [id: string]: string } } = {};

			// The start method will fail because it tries to use gas station for deployment
			await expect(
				connector.start(TEST_NODE_IDENTITY, undefined, componentState)
			).rejects.toThrow();
		}, 20000);

		test("Should handle invalid gas station auth token", async () => {
			const invalidAuthConfig: IIotaNftConnectorConfig = {
				clientOptions: TEST_CLIENT_OPTIONS,
				vaultMnemonicId: TEST_MNEMONIC_NAME,
				network: TEST_NETWORK,
				gasStation: {
					gasStationUrl: GAS_STATION_URL,
					gasStationAuthToken: "invalid-token"
				}
			};

			const connector = new IotaNftConnector({
				config: invalidAuthConfig
			});

			// The start method should fail when trying to deploy with invalid auth token
			const componentState: { contractDeployments?: { [id: string]: string } } = {};
			await expect(
				connector.start(TEST_NODE_IDENTITY, undefined, componentState)
			).rejects.toThrow();
		}, 20000);

		test("Throws error when unauthorized user attempts to transfer NFT using gas station", async () => {
			const testNftId = await gasStationNftConnector.mint(
				TEST_USER_IDENTITY_ID,
				"unauthorized_test"
			);

			await TEST_VAULT_CONNECTOR.setSecret(
				`unauthorizedController/${TEST_MNEMONIC_NAME}`,
				process.env.TEST_NODE_MNEMONIC
			);

			await expect(
				gasStationNftConnector.transfer(
					"unauthorizedController",
					testNftId,
					TEST_USER_IDENTITY_ID_2,
					TEST_ADDRESS_2
				)
			).rejects.toThrow("transferFailed");
		}, 30000);

		test("Cannot transfer a burned NFT using gas station", async () => {
			const burnTestNftId = await gasStationNftConnector.mint(
				TEST_USER_IDENTITY_ID,
				"gas_station_burn_transfer_test"
			);

			await gasStationNftConnector.burn(TEST_USER_IDENTITY_ID, burnTestNftId);
			await expect(
				gasStationNftConnector.transfer(
					TEST_USER_IDENTITY_ID,
					burnTestNftId,
					TEST_USER_IDENTITY_ID_2,
					TEST_ADDRESS_2
				)
			).rejects.toThrow("transferFailed");
		}, 30000);
	});
});
