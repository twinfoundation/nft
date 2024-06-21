// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { CLIDisplay, CLIParam } from "@gtsc/cli-core";
import { Converter, I18n, StringHelper } from "@gtsc/core";
import { IotaNftConnector, IotaNftUtils } from "@gtsc/nft-connector-iota";
import { VaultConnectorFactory } from "@gtsc/vault-models";
import { Command } from "commander";
import { setupVault } from "./setupCommands";

/**
 * Build the nft transfer command for the CLI.
 * @returns The command.
 */
export function buildCommandNftTransfer(): Command {
	const command = new Command();
	command
		.name("nft-transfer")
		.summary(I18n.formatMessage("commands.nft-transfer.summary"))
		.description(I18n.formatMessage("commands.nft-transfer.description"))
		.requiredOption(
			I18n.formatMessage("commands.nft-transfer.options.seed.param"),
			I18n.formatMessage("commands.nft-transfer.options.seed.description")
		)
		.requiredOption(
			I18n.formatMessage("commands.nft-transfer.options.id.param"),
			I18n.formatMessage("commands.nft-transfer.options.id.description")
		)
		.requiredOption(
			I18n.formatMessage("commands.nft-transfer.options.recipient.param"),
			I18n.formatMessage("commands.nft-transfer.options.recipient.description")
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
		.action(actionCommandNftTransfer);

	return command;
}

/**
 * Action the nft transfer command.
 * @param opts The options for the command.
 * @param opts.seed The seed required for signing by the issuer.
 * @param opts.id The id of the NFT to transfer in urn format.
 * @param opts.recipient The recipient address of the NFT.
 * @param opts.node The node URL.
 * @param opts.explorer The explorer URL.
 */
export async function actionCommandNftTransfer(opts: {
	seed: string;
	id: string;
	recipient: string;
	node: string;
	explorer: string;
}): Promise<void> {
	const seed: Uint8Array = CLIParam.hexBase64("seed", opts.seed);
	const id: string = CLIParam.stringValue("id", opts.id);
	const recipient: string = CLIParam.bech32("recipient", opts.recipient);
	const nodeEndpoint: string = CLIParam.url("node", opts.node);
	const explorerEndpoint: string = CLIParam.url("explorer", opts.explorer);

	CLIDisplay.value(I18n.formatMessage("commands.nft-transfer.labels.nftId"), id);
	CLIDisplay.value(I18n.formatMessage("commands.nft-transfer.labels.recipient"), recipient);
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

	CLIDisplay.task(I18n.formatMessage("commands.nft-transfer.progress.transferringNft"));
	CLIDisplay.break();

	CLIDisplay.spinnerStart();

	await iotaNftConnector.transfer(requestContext, id, recipient);

	CLIDisplay.spinnerStop();

	CLIDisplay.value(
		I18n.formatMessage("commands.common.labels.explore"),
		`${StringHelper.trimTrailingSlashes(explorerEndpoint)}/addr/${IotaNftUtils.nftIdToAddress(id)}`
	);
	CLIDisplay.break();

	CLIDisplay.done();
}
