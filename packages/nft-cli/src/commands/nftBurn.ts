// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { CLIDisplay, CLIParam } from "@gtsc/cli-core";
import { Converter, I18n, StringHelper } from "@gtsc/core";
import { IotaNftConnector, IotaNftUtils } from "@gtsc/nft-connector-iota";
import { VaultConnectorFactory } from "@gtsc/vault-models";
import { Command } from "commander";
import { setupVault } from "./setupCommands";

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
			I18n.formatMessage("commands.nft-burn.options.issuer.param"),
			I18n.formatMessage("commands.nft-burn.options.issuer.description")
		)
		.requiredOption(
			I18n.formatMessage("commands.nft-burn.options.id.param"),
			I18n.formatMessage("commands.nft-burn.options.id.description")
		);

	command
		.option(
			I18n.formatMessage("commands.common.options.node.param"),
			I18n.formatMessage("commands.common.options.node.description"),
			"!NODE_URL"
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
 * @param opts.issuer The issuer address of the NFT.
 * @param opts.id The id of the NFT to burn in urn format.
 * @param opts.node The node URL.
 * @param opts.explorer The explorer URL.
 */
export async function actionCommandNftBurn(opts: {
	seed: string;
	issuer: string;
	id: string;
	node: string;
	explorer: string;
}): Promise<void> {
	const seed: Uint8Array = CLIParam.hexBase64("seed", opts.seed);
	const issuer: string = CLIParam.bech32("issuer", opts.issuer);
	const id: string = CLIParam.stringValue("id", opts.id);
	const nodeEndpoint: string = CLIParam.url("node", opts.node);
	const explorerEndpoint: string = CLIParam.url("explorer", opts.explorer);

	CLIDisplay.value(I18n.formatMessage("commands.nft-burn.labels.issuer"), issuer);
	CLIDisplay.value(I18n.formatMessage("commands.nft-burn.labels.nftId"), id);
	CLIDisplay.value(I18n.formatMessage("commands.common.labels.node"), nodeEndpoint);
	CLIDisplay.break();

	setupVault();

	const requestContext = { identity: "local", tenantId: "local" };
	const vaultSeedId = "local-seed";

	const vaultConnector = VaultConnectorFactory.get("vault");
	await vaultConnector.setSecret(requestContext, vaultSeedId, Converter.bytesToBase64(seed));

	const iotaNftConnector = new IotaNftConnector({
		config: {
			clientOptions: {
				nodes: [nodeEndpoint],
				localPow: true
			},
			vaultSeedId
		}
	});

	CLIDisplay.task(I18n.formatMessage("commands.nft-burn.progress.burningNft"));
	CLIDisplay.break();

	CLIDisplay.spinnerStart();

	await iotaNftConnector.burn(requestContext, issuer, id);

	CLIDisplay.spinnerStop();

	CLIDisplay.value(
		I18n.formatMessage("commands.common.labels.explore"),
		`${StringHelper.trimTrailingSlashes(explorerEndpoint)}/addr/${IotaNftUtils.nftIdToAddress(id)}`
	);
	CLIDisplay.break();

	CLIDisplay.done();
}
