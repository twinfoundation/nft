// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { EntitySchemaFactory, EntitySchemaHelper } from "@gtsc/entity";
import { nameof } from "@gtsc/nameof";
import { Nft } from "./entities/nft";

/**
 * Initialize the schema for the NFT entity storage connector.
 */
export function initSchema(): void {
	EntitySchemaFactory.register(nameof<Nft>(), () => EntitySchemaHelper.getSchema(Nft));
}
