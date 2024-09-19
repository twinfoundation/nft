// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IRestRouteEntryPoint } from "@twin.org/api-models";
import { generateRestRoutesNft, tagsNft } from "./nftRoutes";

export const restEntryPoints: IRestRouteEntryPoint[] = [
	{
		name: "nft",
		defaultBaseRoute: "nft",
		tags: tagsNft,
		generateRoutes: generateRestRoutesNft
	}
];
