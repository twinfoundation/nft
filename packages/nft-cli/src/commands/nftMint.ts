// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import path from "node:path";
import { CLIDisplay, CLIOptions, CLIParam, CLIUtils } from "@gtsc/cli-core";
import { Converter, I18n, Is, StringHelper } from "@gtsc/core";
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
 * Build the nft mint command for the CLI.
 * @returns The command.
 */
export function buildCommandNftMint(): Command {
	const command = new Command();
	command
		.name("nft-mint")
		.summary(I18n.formatMessage("commands.nft-mint.summary"))
		.description(I18n.formatMessage("commands.nft-mint.description"))
		.requiredOption(
			I18n.formatMessage("commands.nft-mint.options.seed.param"),
			I18n.formatMessage("commands.nft-mint.options.seed.description")
		)
		.requiredOption(
			I18n.formatMessage("commands.nft-mint.options.issuer.param"),
			I18n.formatMessage("commands.nft-mint.options.issuer.description")
		)
		.requiredOption(
			I18n.formatMessage("commands.nft-mint.options.tag.param"),
			I18n.formatMessage("commands.nft-mint.options.tag.description")
		)
		.option(
			I18n.formatMessage("commands.nft-mint.options.immutable-json.param"),
			I18n.formatMessage("commands.nft-mint.options.immutable-json.description")
		)
		.option(
			I18n.formatMessage("commands.nft-mint.options.mutable-json.param"),
			I18n.formatMessage("commands.nft-mint.options.mutable-json.description")
		);

	CLIOptions.output(command, {
		noConsole: true,
		json: true,
		env: true,
		mergeJson: true,
		mergeEnv: true
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
		.action(actionCommandNftMint);

	return command;
}

/**
 * Action the nft mint command.
 * @param opts The options for the command.
 * @param opts.seed The seed required for signing by the issuer.
 * @param opts.issuer The issuer address of the NFT.
 * @param opts.tag The tag for the NFT.
 * @param opts.immutableJson Filename of the immutable JSON data.
 * @param opts.mutableJson Filename of the mutable JSON data.
 * @param opts.console Flag to display on the console.
 * @param opts.json Output the data to a JSON file.
 * @param opts.mergeJson Merge the data to a JSON file.
 * @param opts.env Output the data to an environment file.
 * @param opts.mergeEnv Merge the data to an environment file.
 * @param opts.node The node URL.
 * @param opts.explorer The explorer URL.
 */
export async function actionCommandNftMint(opts: {
	seed: string;
	issuer: string;
	tag: string;
	immutableJson?: string;
	mutableJson?: string;
	console: boolean;
	json?: string;
	mergeJson: boolean;
	env?: string;
	mergeEnv: boolean;
	node: string;
	explorer: string;
}): Promise<void> {
	const seed: Uint8Array = CLIParam.hexBase64("seed", opts.seed);
	const issuer: string = CLIParam.bech32("issuer", opts.issuer);
	const tag: string = CLIParam.stringValue("tag", opts.tag);
	const immutableJson: string | undefined = opts.immutableJson
		? path.resolve(opts.immutableJson)
		: undefined;
	const mutableJson: string | undefined = opts.mutableJson
		? path.resolve(opts.mutableJson)
		: undefined;
	const nodeEndpoint: string = CLIParam.url("node", opts.node);
	const explorerEndpoint: string = CLIParam.url("explorer", opts.explorer);

	CLIDisplay.value(I18n.formatMessage("commands.nft-mint.labels.issuer"), issuer);
	CLIDisplay.value(I18n.formatMessage("commands.nft-mint.labels.tag"), tag);
	if (Is.stringValue(immutableJson)) {
		CLIDisplay.value(
			I18n.formatMessage("commands.nft-mint.labels.immutableJsonFilename"),
			immutableJson
		);
	}
	if (Is.stringValue(mutableJson)) {
		CLIDisplay.value(
			I18n.formatMessage("commands.nft-mint.labels.mutableJsonFilename"),
			mutableJson
		);
	}
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
	const vaultSeedId = "local-seed";

	const iotaNftConnector = new IotaNftConnector(
		{
			vaultConnector
		},
		{
			clientOptions: {
				nodes: [nodeEndpoint],
				localPow: true
			},
			vaultSeedId
		}
	);

	await vaultConnector.setSecret(requestContext, vaultSeedId, Converter.bytesToBase64(seed));

	const immutableJsonData = Is.stringValue(immutableJson)
		? await CLIUtils.readJsonFile(immutableJson)
		: undefined;
	const mutableJsonData = Is.stringValue(mutableJson)
		? await CLIUtils.readJsonFile(mutableJson)
		: undefined;

	if (Is.object(immutableJsonData)) {
		CLIDisplay.section(I18n.formatMessage("commands.nft-mint.labels.immutableJson"));
		CLIDisplay.write(JSON.stringify(immutableJsonData, undefined, 2));
		CLIDisplay.break();
		CLIDisplay.break();
	}

	if (Is.object(mutableJsonData)) {
		CLIDisplay.section(I18n.formatMessage("commands.nft-mint.labels.mutableJson"));
		CLIDisplay.write(JSON.stringify(mutableJsonData, undefined, 2));
		CLIDisplay.break();
		CLIDisplay.break();
	}

	CLIDisplay.task(I18n.formatMessage("commands.nft-mint.progress.mintingNft"));
	CLIDisplay.break();

	CLIDisplay.spinnerStart();

	const nftId = await iotaNftConnector.mint(
		requestContext,
		issuer,
		tag,
		immutableJsonData,
		mutableJsonData
	);

	CLIDisplay.spinnerStop();

	if (opts.console) {
		CLIDisplay.value(I18n.formatMessage("commands.nft-mint.labels.nftId"), nftId);
		CLIDisplay.break();
	}

	if (Is.stringValue(opts?.json)) {
		await CLIUtils.writeJsonFile(opts.json, { nftId }, opts.mergeJson);
	}
	if (Is.stringValue(opts?.env)) {
		await CLIUtils.writeEnvFile(opts.env, [`NFT_ID="${nftId}"`], opts.mergeEnv);
	}

	CLIDisplay.value(
		I18n.formatMessage("commands.common.labels.explore"),
		`${StringHelper.trimTrailingSlashes(explorerEndpoint)}/addr/${IotaNftUtils.nftIdToAddress(nftId)}`
	);
	CLIDisplay.break();

	CLIDisplay.done();
}
