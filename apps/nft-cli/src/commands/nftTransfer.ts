// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { CLIDisplay, CLIParam } from "@twin.org/cli-core";
import { Converter, I18n, Is, StringHelper } from "@twin.org/core";
import { IotaNftUtils } from "@twin.org/nft-connector-iota";
import { IotaRebasedNftUtils } from "@twin.org/nft-connector-iota-rebased";
import { VaultConnectorFactory } from "@twin.org/vault-models";
import { Command, Option } from "commander";
import { setupNftConnector, setupVault } from "./setupCommands";
import { NftConnectorTypes } from "../models/nftConnectorTypes";

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
			I18n.formatMessage("commands.nft-transfer.options.recipientIdentity.param"),
			I18n.formatMessage("commands.nft-transfer.options.recipientIdentity.description")
		)
		.requiredOption(
			I18n.formatMessage("commands.nft-transfer.options.recipientAddress.param"),
			I18n.formatMessage("commands.nft-transfer.options.recipientAddress.description")
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
		.action(actionCommandNftTransfer);

	return command;
}

/**
 * Action the nft transfer command.
 * @param opts The options for the command.
 * @param opts.seed The seed required for signing by the issuer.
 * @param opts.id The id of the NFT to transfer in urn format.
 * @param opts.recipientIdentity The recipient address of the NFT.
 * @param opts.recipientAddress The recipient address of the NFT.
 * @param opts.connector The connector to perform the operations with.
 * @param opts.node The node URL.
 * @param opts.network The network to use for rebased connector.
 * @param opts.explorer The explorer URL.
 */
export async function actionCommandNftTransfer(opts: {
	seed: string;
	id: string;
	recipientIdentity: string;
	recipientAddress: string;
	connector?: NftConnectorTypes;
	node: string;
	network?: string;
	explorer: string;
}): Promise<void> {
	const seed: Uint8Array = CLIParam.hexBase64("seed", opts.seed);
	const id: string = CLIParam.stringValue("id", opts.id);
	const recipientIdentity: string = CLIParam.stringValue(
		"recipientIdentity",
		opts.recipientIdentity
	);
	const recipientAddress: string =
		opts.connector === NftConnectorTypes.IotaRebased
			? Converter.bytesToHex(CLIParam.hex("recipientAddress", opts.recipientAddress), true)
			: CLIParam.bech32("recipientAddress", opts.recipientAddress);
	const nodeEndpoint: string = CLIParam.url("node", opts.node);
	const network: string | undefined =
		opts.connector === NftConnectorTypes.IotaRebased
			? CLIParam.stringValue("network", opts.network)
			: undefined;
	const explorerEndpoint: string = CLIParam.url("explorer", opts.explorer);

	CLIDisplay.value(I18n.formatMessage("commands.nft-transfer.labels.nftId"), id);
	CLIDisplay.value(
		I18n.formatMessage("commands.nft-transfer.labels.recipientIdentity"),
		recipientIdentity
	);
	CLIDisplay.value(
		I18n.formatMessage("commands.nft-transfer.labels.recipientAddress"),
		recipientAddress
	);
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

	const nftConnector = setupNftConnector({ nodeEndpoint, network, vaultSeedId }, opts.connector);
	if (Is.function(nftConnector.start)) {
		await nftConnector.start(localIdentity);
	}

	CLIDisplay.task(I18n.formatMessage("commands.nft-transfer.progress.transferringNft"));
	CLIDisplay.break();

	CLIDisplay.spinnerStart();

	await nftConnector.transfer(localIdentity, id, recipientIdentity, recipientAddress);

	CLIDisplay.spinnerStop();

	CLIDisplay.value(
		I18n.formatMessage("commands.common.labels.explore"),
		opts.connector === NftConnectorTypes.IotaRebased
			? `${StringHelper.trimTrailingSlashes(explorerEndpoint)}/object/${IotaRebasedNftUtils.nftIdToObjectId(id)}?network=${network}`
			: `${StringHelper.trimTrailingSlashes(explorerEndpoint)}/addr/${IotaNftUtils.nftIdToAddress(id)}`
	);
	CLIDisplay.break();

	CLIDisplay.done();
}
