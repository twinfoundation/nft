// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IRestRouteEntryPoint } from "@gtsc/api-models";
import { generateRestRoutesNft, tagsNft } from "./nftRoutes";

export const restEntryPoints: IRestRouteEntryPoint[] = [
	{
		name: "nft",
		tags: tagsNft,
		generateRoutes: generateRestRoutesNft
	}
];
