// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { CLIDisplay, CLIParam } from "@twin.org/cli-core";
import { Converter, I18n, Is, StringHelper } from "@twin.org/core";
import { IotaNftUtils } from "@twin.org/nft-connector-iota";
import { VaultConnectorFactory } from "@twin.org/vault-models";
import { setupWalletConnector } from "@twin.org/wallet-cli";
import { WalletConnectorFactory } from "@twin.org/wallet-models";
import { Command, Option } from "commander";
import { setupNftConnector, setupVault } from "./setupCommands";
import { NftConnectorTypes } from "../models/nftConnectorTypes";

/**
 * Build the nft burn command for the CLI.
 * @returns The command.
 */
export function buildCommandNftBurn(): Command {
	const command = new Command();
	command
		.name("nft-burn")
		.summary(I18n.formatMessage("commands.nft-burn.summary"))
		.description(I18n.formatMessage("commands.nft-burn.description"))
		.requiredOption(
			I18n.formatMessage("commands.nft-burn.options.seed.param"),
			I18n.formatMessage("commands.nft-burn.options.seed.description")
		)
		.requiredOption(
			I18n.formatMessage("commands.nft-burn.options.id.param"),
			I18n.formatMessage("commands.nft-burn.options.id.description")
		);

	command
		.addOption(
			new Option(
				I18n.formatMessage("commands.common.options.connector.param"),
				I18n.formatMessage("commands.common.options.connector.description")
			)
				.choices(Object.values(NftConnectorTypes))
				.default(NftConnectorTypes.Iota)
		)
		.option(
			I18n.formatMessage("commands.common.options.node.param"),
			I18n.formatMessage("commands.common.options.node.description"),
			"!NODE_URL"
		)
		.option(
			I18n.formatMessage("commands.common.options.network.param"),
			I18n.formatMessage("commands.common.options.network.description"),
			"!NETWORK"
		)
		.option(
			I18n.formatMessage("commands.common.options.explorer.param"),
			I18n.formatMessage("commands.common.options.explorer.description"),
			"!EXPLORER_URL"
		)
		.action(actionCommandNftBurn);

	return command;
}

/**
 * Action the nft burn command.
 * @param opts The options for the command.
 * @param opts.seed The seed required for signing by the issuer.
 * @param opts.id The id of the NFT to burn in urn format.
 * @param opts.connector The connector to perform the operations with.
 * @param opts.node The node URL.
 * @param opts.network The network to use for connector.
 * @param opts.explorer The explorer URL.
 */
export async function actionCommandNftBurn(opts: {
	seed: string;
	id: string;
	connector?: NftConnectorTypes;
	node: string;
	network?: string;
	explorer: string;
}): Promise<void> {
	const seed: Uint8Array = CLIParam.hexBase64("seed", opts.seed);
	const id: string = CLIParam.stringValue("id", opts.id);
	const nodeEndpoint: string = CLIParam.url("node", opts.node);
	const network: string | undefined =
		opts.connector === NftConnectorTypes.Iota
			? CLIParam.stringValue("network", opts.network)
			: undefined;
	const explorerEndpoint: string = CLIParam.url("explorer", opts.explorer);

	CLIDisplay.value(I18n.formatMessage("commands.nft-burn.labels.nftId"), id);
	CLIDisplay.value(I18n.formatMessage("commands.common.labels.node"), nodeEndpoint);
	if (Is.stringValue(network)) {
		CLIDisplay.value(I18n.formatMessage("commands.common.labels.network"), network);
	}
	CLIDisplay.break();

	setupVault();

	const localIdentity = "local";
	const vaultSeedId = "local-seed";

	const vaultConnector = VaultConnectorFactory.get("vault");
	await vaultConnector.setSecret(`${localIdentity}/${vaultSeedId}`, Converter.bytesToBase64(seed));

	const walletConnector = setupWalletConnector(
		{ nodeEndpoint, network, vaultSeedId },
		opts.connector
	);
	WalletConnectorFactory.register("wallet", () => walletConnector);

	const nftConnector = setupNftConnector({ nodeEndpoint, network, vaultSeedId }, opts.connector);
	if (Is.function(nftConnector.start)) {
		await nftConnector.start(localIdentity);
	}

	CLIDisplay.task(I18n.formatMessage("commands.nft-burn.progress.burningNft"));
	CLIDisplay.break();

	CLIDisplay.spinnerStart();

	await nftConnector.burn(localIdentity, id);

	CLIDisplay.spinnerStop();

	CLIDisplay.value(
		I18n.formatMessage("commands.common.labels.explore"),
		`${StringHelper.trimTrailingSlashes(explorerEndpoint)}/object/${IotaNftUtils.nftIdToObjectId(id)}?network=${network}`
	);
	CLIDisplay.break();

	CLIDisplay.done();
}
