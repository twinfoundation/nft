// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import {
	CLIDisplay,
	CLIOptions,
	CLIParam,
	CLIUtils,
	type CliOutputOptions
} from "@twin.org/cli-core";
import { I18n, Is, StringHelper } from "@twin.org/core";
import { IotaNftUtils } from "@twin.org/nft-connector-iota";
import { IotaStardustNftUtils } from "@twin.org/nft-connector-iota-stardust";
import { setupWalletConnector } from "@twin.org/wallet-cli";
import { WalletConnectorFactory } from "@twin.org/wallet-models";
import { Command, Option } from "commander";
import { setupNftConnector, setupVault } from "./setupCommands";
import { NftConnectorTypes } from "../models/nftConnectorTypes";

/**
 * Build the nft resolve command for the CLI.
 * @returns The command.
 */
export function buildCommandNftResolve(): Command {
	const command = new Command();
	command
		.name("nft-resolve")
		.summary(I18n.formatMessage("commands.nft-resolve.summary"))
		.description(I18n.formatMessage("commands.nft-resolve.description"))
		.requiredOption(
			I18n.formatMessage("commands.nft-resolve.options.id.param"),
			I18n.formatMessage("commands.nft-resolve.options.id.description")
		);

	CLIOptions.output(command, {
		noConsole: true,
		json: true,
		env: false,
		mergeJson: true,
		mergeEnv: false
	});

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
		.action(actionCommandNftResolve);

	return command;
}

/**
 * Action the nft resolve command.
 * @param opts The options for the command.
 * @param opts.id The id of the NFT to resolve in urn format.
 * @param opts.connector The connector to perform the operations with.
 * @param opts.node The node URL.
 * @param opts.network The network to use for connector.
 * @param opts.explorer The explorer URL.
 */
export async function actionCommandNftResolve(
	opts: {
		id: string;
		connector?: NftConnectorTypes;
		node: string;
		network?: string;
		explorer: string;
	} & CliOutputOptions
): Promise<void> {
	const id: string = CLIParam.stringValue("id", opts.id);
	const nodeEndpoint: string = CLIParam.url("node", opts.node);
	const network: string | undefined =
		opts.connector === NftConnectorTypes.Iota
			? CLIParam.stringValue("network", opts.network)
			: undefined;
	const explorerEndpoint: string = CLIParam.url("explorer", opts.explorer);

	CLIDisplay.value(I18n.formatMessage("commands.nft-resolve.labels.nftId"), id);
	CLIDisplay.value(I18n.formatMessage("commands.common.labels.node"), nodeEndpoint);
	if (Is.stringValue(network)) {
		CLIDisplay.value(I18n.formatMessage("commands.common.labels.network"), network);
	}
	CLIDisplay.break();

	setupVault();

	const walletConnector = setupWalletConnector(
		{ nodeEndpoint, network },
		opts.connector
	);
	WalletConnectorFactory.register("wallet", () => walletConnector);

	const nftConnector = setupNftConnector({ nodeEndpoint, network }, opts.connector);

	CLIDisplay.task(I18n.formatMessage("commands.nft-resolve.progress.resolvingNft"));
	CLIDisplay.break();

	CLIDisplay.spinnerStart();

	const nft = await nftConnector.resolve(id);

	CLIDisplay.spinnerStop();

	if (opts.console) {
		CLIDisplay.section(I18n.formatMessage("commands.nft-resolve.labels.nft"));
		CLIDisplay.json(nft);
		CLIDisplay.break();
	}

	if (Is.stringValue(opts?.json)) {
		await CLIUtils.writeJsonFile(opts.json, nft, opts.mergeJson);
	}

	CLIDisplay.value(
		I18n.formatMessage("commands.common.labels.explore"),
		opts.connector === NftConnectorTypes.Iota
			? `${StringHelper.trimTrailingSlashes(explorerEndpoint)}/object/${IotaNftUtils.nftIdToObjectId(id)}?network=${network}`
			: `${StringHelper.trimTrailingSlashes(explorerEndpoint)}/addr/${IotaStardustNftUtils.nftIdToAddress(id)}`
	);
	CLIDisplay.break();

	CLIDisplay.done();
}
