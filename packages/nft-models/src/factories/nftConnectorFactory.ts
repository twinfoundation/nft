// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Factory } from "@gtsc/core";
import type { INftConnector } from "../models/INftConnector";

/**
 * Factory for creating NFT connectors.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const NftConnectorFactory = Factory.createFactory<INftConnector>("nft-connector");
