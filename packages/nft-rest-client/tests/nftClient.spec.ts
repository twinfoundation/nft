// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { NftClient } from "../src/nftClient";

describe("NftClient", () => {
	test("Can create an instance", async () => {
		const client = new NftClient({ endpoint: "http://localhost:8080" });
		expect(client).toBeDefined();
	});
});
