// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { CLIDisplay, CLIOptions, CLIParam, CLIUtils } from "@gtsc/cli-core";
import { I18n, Is, StringHelper } from "@gtsc/core";
import { EntitySchemaHelper } from "@gtsc/entity";
import { MemoryEntityStorageConnector } from "@gtsc/entity-storage-connector-memory";
import { IotaNftConnector, IotaNftUtils } from "@gtsc/nft-connector-iota";
import {
	EntityStorageVaultConnector,
	VaultKey,
	VaultSecret
} from "@gtsc/vault-connector-entity-storage";
import { Command } from "commander";

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
		.action(actionCommandNftResolve);

	return command;
}

/**
 * Action the nft resolve command.
 * @param opts The options for the command.
 * @param opts.id The id of the NFT to resolve in urn format.
 * @param opts.console Flag to display on the console.
 * @param opts.json Output the data to a JSON file.
 * @param opts.mergeJson Merge the data to a JSON file.
 * @param opts.node The node URL.
 * @param opts.explorer The explorer URL.
 */
export async function actionCommandNftResolve(opts: {
	id: string;
	console: boolean;
	json?: string;
	mergeJson: boolean;
	node: string;
	explorer: string;
}): Promise<void> {
	const id: string = CLIParam.stringValue("id", opts.id);
	const nodeEndpoint: string = CLIParam.url("node", opts.node);
	const explorerEndpoint: string = CLIParam.url("explorer", opts.explorer);

	CLIDisplay.value(I18n.formatMessage("commands.nft-resolve.labels.nftId"), id);
	CLIDisplay.value(I18n.formatMessage("commands.common.labels.node"), nodeEndpoint);
	CLIDisplay.break();

	const vaultConnector = new EntityStorageVaultConnector({
		vaultKeyEntityStorageConnector: new MemoryEntityStorageConnector<VaultKey>(
			EntitySchemaHelper.getSchema(VaultKey)
		),
		vaultSecretEntityStorageConnector: new MemoryEntityStorageConnector<VaultSecret>(
			EntitySchemaHelper.getSchema(VaultSecret)
		)
	});

	const requestContext = { identity: "local", tenantId: "local" };

	const iotaNftConnector = new IotaNftConnector(
		{
			vaultConnector
		},
		{
			clientOptions: {
				nodes: [nodeEndpoint],
				localPow: true
			}
		}
	);

	CLIDisplay.task(I18n.formatMessage("commands.nft-resolve.progress.resolvingNft"));
	CLIDisplay.break();

	CLIDisplay.spinnerStart();

	const nft = await iotaNftConnector.resolve(requestContext, id);

	CLIDisplay.spinnerStop();

	if (opts.console) {
		CLIDisplay.section(I18n.formatMessage("commands.nft-resolve.labels.nft"));

		CLIDisplay.write(JSON.stringify(nft, undefined, 2));
		CLIDisplay.break();
	}

	if (Is.stringValue(opts?.json)) {
		await CLIUtils.writeJsonFile(opts.json, nft, opts.mergeJson);
	}

	CLIDisplay.value(
		I18n.formatMessage("commands.common.labels.explore"),
		`${StringHelper.trimTrailingSlashes(explorerEndpoint)}/addr/${IotaNftUtils.nftIdToAddress(id)}`
	);
	CLIDisplay.break();

	CLIDisplay.done();
}
