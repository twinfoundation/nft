// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import path from "node:path";
import {
	CLIDisplay,
	CLIOptions,
	CLIParam,
	CLIUtils,
	type CliOutputOptions
} from "@twin.org/cli-core";
import { Converter, I18n, Is, StringHelper } from "@twin.org/core";
import { IotaNftUtils } from "@twin.org/nft-connector-iota";
import { VaultConnectorFactory } from "@twin.org/vault-models";
import { setupWalletConnector } from "@twin.org/wallet-cli";
import { WalletConnectorFactory } from "@twin.org/wallet-models";
import { Command, Option } from "commander";
import { setupNftConnector, setupVault } from "./setupCommands";
import { NftConnectorTypes } from "../models/nftConnectorTypes";

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
		.option(
			I18n.formatMessage("commands.nft-mint.options.wallet-address-index.param"),
			I18n.formatMessage("commands.nft-mint.options.wallet-address-index.description"),
			"0"
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
		.addOption(
			new Option(
				I18n.formatMessage("commands.common.options.connector.param"),
				I18n.formatMessage("commands.common.options.connector.description")
			)
				.choices(Object.values(NftConnectorTypes))
				.default(NftConnectorTypes.Iota)
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
		.option(
			I18n.formatMessage("commands.common.options.node.param"),
			I18n.formatMessage("commands.common.options.node.description"),
			"!NODE_URL"
		)
		.action(actionCommandNftMint);

	return command;
}

/**
 * Action the nft mint command.
 * @param opts The options for the command.
 * @param opts.seed The seed required for signing by the issuer.
 * @param opts.issuer The identity of the issuer.
 * @param opts.walletAddressIndex The wallet address index.
 * @param opts.tag The tag for the NFT.
 * @param opts.immutableJson Filename of the immutable JSON data.
 * @param opts.mutableJson Filename of the mutable JSON data.
 * @param opts.connector The connector to perform the operations with.
 * @param opts.node The node URL.
 * @param opts.network The network to use for connector.
 * @param opts.explorer The explorer URL.
 */
export async function actionCommandNftMint(
	opts: {
		seed: string;
		issuer: string;
		walletAddressIndex?: string;
		tag: string;
		immutableJson?: string;
		mutableJson?: string;
		connector?: NftConnectorTypes;
		node: string;
		network?: string;
		explorer: string;
	} & CliOutputOptions
): Promise<void> {
	const seed: Uint8Array = CLIParam.hexBase64("seed", opts.seed);
	const issuer: string = CLIParam.stringValue("issuer", opts.issuer);
	const walletAddressIndex = Is.empty(opts.walletAddressIndex)
		? undefined
		: CLIParam.integer("wallet-address-index", opts.walletAddressIndex);
	const tag: string = CLIParam.stringValue("tag", opts.tag);
	const immutableJson: string | undefined = opts.immutableJson
		? path.resolve(opts.immutableJson)
		: undefined;
	const mutableJson: string | undefined = opts.mutableJson
		? path.resolve(opts.mutableJson)
		: undefined;
	const nodeEndpoint: string = CLIParam.url("node", opts.node);
	const network: string | undefined =
		opts.connector === NftConnectorTypes.Iota
			? CLIParam.stringValue("network", opts.network)
			: undefined;
	const explorerEndpoint: string = CLIParam.url("explorer", opts.explorer);

	CLIDisplay.value(I18n.formatMessage("commands.nft-mint.labels.issuer"), issuer);
	if (Is.integer(walletAddressIndex)) {
		CLIDisplay.value(
			I18n.formatMessage("commands.nft-mint.labels.walletAddressIndex"),
			walletAddressIndex
		);
	}
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
	if (Is.stringValue(network)) {
		CLIDisplay.value(I18n.formatMessage("commands.common.labels.network"), network);
	}
	CLIDisplay.break();

	setupVault();

	const localIdentity = issuer;
	const vaultSeedId = "local-seed";

	const vaultConnector = VaultConnectorFactory.get("vault");
	await vaultConnector.setSecret(`${localIdentity}/${vaultSeedId}`, Converter.bytesToBase64(seed));

	const walletConnector = setupWalletConnector(
		{ nodeEndpoint, network, vaultSeedId },
		opts.connector
	);
	WalletConnectorFactory.register("wallet", () => walletConnector);

	const nftConnector = setupNftConnector(
		{ nodeEndpoint, network, vaultSeedId, walletAddressIndex },
		opts.connector
	);
	if (Is.function(nftConnector.start)) {
		await nftConnector.start(localIdentity);
	}

	const immutableJsonData = Is.stringValue(immutableJson)
		? await CLIUtils.readJsonFile(immutableJson)
		: undefined;
	const mutableJsonData = Is.stringValue(mutableJson)
		? await CLIUtils.readJsonFile(mutableJson)
		: undefined;

	if (Is.object(immutableJsonData)) {
		CLIDisplay.section(I18n.formatMessage("commands.nft-mint.labels.immutableJson"));
		CLIDisplay.json(immutableJsonData);
		CLIDisplay.break();
	}

	if (Is.object(mutableJsonData)) {
		CLIDisplay.section(I18n.formatMessage("commands.nft-mint.labels.mutableJson"));
		CLIDisplay.json(mutableJsonData);
		CLIDisplay.break();
	}

	CLIDisplay.task(I18n.formatMessage("commands.nft-mint.progress.mintingNft"));
	CLIDisplay.break();

	CLIDisplay.spinnerStart();

	const nftId = await nftConnector.mint(localIdentity, tag, immutableJsonData, mutableJsonData);

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

		`${StringHelper.trimTrailingSlashes(explorerEndpoint)}/object/${IotaNftUtils.nftIdToObjectId(nftId)}?network=${network}`
	);
	CLIDisplay.break();

	CLIDisplay.done();
}
