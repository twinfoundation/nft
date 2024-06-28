// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type { IRestRoute, ITag } from "@gtsc/api-models";
import { Guards } from "@gtsc/core";
import { nameof } from "@gtsc/nameof";
import type {
	INft,
	INftBurnRequest,
	INftMintRequest,
	INftMintResponse,
	INftResolveRequest,
	INftResolveResponse,
	INftTransferRequest,
	INftUpdateRequest
} from "@gtsc/nft-models";
import { ServiceFactory, type IRequestContext } from "@gtsc/services";
import { HttpStatusCodes } from "@gtsc/web";

/**
 * The source used when communicating about these routes.
 */
const ROUTES_SOURCE = "nftRoutes";

/**
 * The tag to associate with the routes.
 */
export const tags: ITag[] = [
	{
		name: "NFT",
		description: "Endpoints which are modelled to access an NFT contract."
	}
];

/**
 * The REST routes for NFT.
 * @param baseRouteName Prefix to prepend to the paths.
 * @param factoryServiceName The name of the service to use in the routes store in the ServiceFactory.
 * @returns The generated routes.
 */
export function generateRestRoutes(
	baseRouteName: string,
	factoryServiceName: string
): IRestRoute[] {
	const mintRoute: IRestRoute<INftMintRequest, INftMintResponse> = {
		operationId: "nftMint",
		summary: "Mint an NFT",
		tag: tags[0].name,
		method: "POST",
		path: `${baseRouteName}/`,
		handler: async (requestContext, request) =>
			nftMint(requestContext, factoryServiceName, request),
		requestType: {
			type: nameof<INftMintRequest>(),
			examples: [
				{
					id: "nftMintExample",
					request: {
						body: {
							issuer: "tst1prctjk5ck0dutnsunnje6u90jk5htx03qznjjmkd6843pzltlgz87srjzzv",
							tag: "MY-NFT",
							immutableMetadata: {
								docName: "bill-of-lading",
								mimeType: "application/pdf",
								fingerprint: "0xf0b95a98b3dbc5ce1c9ce59d70af95a97599f100a7296ecdd1eb108bebfa047f"
							},
							metadata: {
								data: "tst1prctjk5ck0dutnsunnje6u90jk5htx03qznjjmkd6843pzltlgz87srjzzv"
							}
						}
					}
				}
			]
		},
		responseType: [
			{
				type: nameof<INftMintResponse>(),
				examples: [
					{
						id: "nftMintResponseExample",
						response: {
							statusCode: HttpStatusCodes.CREATED,
							headers: {
								Location:
									"urn:iota-nft:aW90YS1uZnQ6dHN0OjB4NzYyYjljNDllYTg2OWUwZWJkYTliYmZhNzY5Mzk0NDdhNDI4ZGNmMTc4YzVkMTVhYjQ0N2UyZDRmYmJiNGViMg=="
							}
						}
					}
				]
			}
		]
	};

	const resolveRoute: IRestRoute<INftResolveRequest, INftResolveResponse> = {
		operationId: "nftResolve",
		summary: "Resolve an NFT",
		tag: tags[0].name,
		method: "GET",
		path: `${baseRouteName}/:id`,
		handler: async (requestContext, request) =>
			nftResolve(requestContext, factoryServiceName, request),
		requestType: {
			type: nameof<INftResolveRequest>(),
			examples: [
				{
					id: "nftResolveExample",
					request: {
						pathParams: {
							id: "urn:iota-nft:aW90YS1uZnQ6dHN0OjB4NzYyYjljNDllYTg2OWUwZWJkYTliYmZhNzY5Mzk0NDdhNDI4ZGNmMTc4YzVkMTVhYjQ0N2UyZDRmYmJiNGViMg=="
						}
					}
				}
			]
		},
		responseType: [
			{
				type: nameof<INftResolveResponse>(),
				examples: [
					{
						id: "nftResolveResponseExample",
						response: {
							body: {
								issuer: "tst1prctjk5ck0dutnsunnje6u90jk5htx03qznjjmkd6843pzltlgz87srjzzv",
								owner: "tst1prctjk5ck0dutnsunnje6u90jk5htx03qznjjmkd6843pzltlgz87srjzzv",
								tag: "MY-NFT",
								immutableMetadata: {
									docName: "bill-of-lading",
									mimeType: "application/pdf",
									fingerprint: "0xf0b95a98b3dbc5ce1c9ce59d70af95a97599f100a7296ecdd1eb108bebfa047f"
								},
								metadata: {
									data: "AAAAA"
								}
							}
						}
					}
				]
			}
		]
	};

	const burnRoute: IRestRoute<INftBurnRequest, void> = {
		operationId: "nftBurn",
		summary: "Burn an NFT",
		tag: tags[0].name,
		method: "POST",
		path: `${baseRouteName}/:id/burn`,
		handler: async (requestContext, request) =>
			nftBurn(requestContext, factoryServiceName, request),
		requestType: {
			type: nameof<INftBurnRequest>(),
			examples: [
				{
					id: "nftBurnExample",
					request: {
						pathParams: {
							id: "urn:iota-nft:aW90YS1uZnQ6dHN0OjB4NzYyYjljNDllYTg2OWUwZWJkYTliYmZhNzY5Mzk0NDdhNDI4ZGNmMTc4YzVkMTVhYjQ0N2UyZDRmYmJiNGViMg=="
						},
						body: {
							owner: "tst1prctjk5ck0dutnsunnje6u90jk5htx03qznjjmkd6843pzltlgz87srjzzv"
						}
					}
				}
			]
		}
	};

	const transferRoute: IRestRoute<INftTransferRequest, void> = {
		operationId: "nftTransfer",
		summary: "Transfer an NFT",
		tag: tags[0].name,
		method: "POST",
		path: `${baseRouteName}/:id/transfer`,
		handler: async (requestContext, request) =>
			nftTransfer(requestContext, factoryServiceName, request),
		requestType: {
			type: nameof<INftTransferRequest>(),
			examples: [
				{
					id: "nftTransferExample",
					request: {
						pathParams: {
							id: "urn:iota-nft:aW90YS1uZnQ6dHN0OjB4NzYyYjljNDllYTg2OWUwZWJkYTliYmZhNzY5Mzk0NDdhNDI4ZGNmMTc4YzVkMTVhYjQ0N2UyZDRmYmJiNGViMg=="
						},
						body: {
							recipient: "tst1prctjk5ck0dutnsunnje6u90jk5htx03qznjjmkd6843pzltlgz87srjzzv",
							metadata: {
								data: "AAAAA"
							}
						}
					}
				}
			]
		}
	};

	const updateRoute: IRestRoute<INftUpdateRequest, void> = {
		operationId: "nftUpdate",
		summary: "Update an NFT",
		tag: tags[0].name,
		method: "PUT",
		path: `${baseRouteName}/:id`,
		handler: async (requestContext, request) =>
			nftUpdate(requestContext, factoryServiceName, request),
		requestType: {
			type: nameof<INftUpdateRequest>(),
			examples: [
				{
					id: "nftUpdateExample",
					request: {
						pathParams: {
							id: "urn:iota-nft:aW90YS1uZnQ6dHN0OjB4NzYyYjljNDllYTg2OWUwZWJkYTliYmZhNzY5Mzk0NDdhNDI4ZGNmMTc4YzVkMTVhYjQ0N2UyZDRmYmJiNGViMg=="
						},
						body: {
							metadata: {
								data: "AAAAA"
							}
						}
					}
				}
			]
		}
	};

	return [mintRoute, resolveRoute, burnRoute, transferRoute, updateRoute];
}

/**
 * Mint an NFT.
 * @param requestContext The request context for the API.
 * @param factoryServiceName The name of the service to use in the routes.
 * @param request The request.
 * @returns The response object with additional http response properties.
 */
export async function nftMint(
	requestContext: IRequestContext,
	factoryServiceName: string,
	request: INftMintRequest
): Promise<INftMintResponse> {
	Guards.object<INftMintRequest>(ROUTES_SOURCE, nameof(request), request);
	Guards.object<INftMintRequest["body"]>(ROUTES_SOURCE, nameof(request.body), request.body);
	Guards.stringValue(ROUTES_SOURCE, nameof(request.body.issuer), request.body.issuer);
	Guards.stringValue(ROUTES_SOURCE, nameof(request.body.tag), request.body.tag);
	const service = ServiceFactory.get<INft>(factoryServiceName);
	const id = await service.mint(
		requestContext,
		request.body.issuer,
		request.body.tag,
		request.body.immutableMetadata,
		request.body.metadata,
		{
			namespace: request.body.namespace
		}
	);
	return {
		statusCode: HttpStatusCodes.CREATED,
		headers: {
			Location: id
		}
	};
}

/**
 * Resolve an NFT.
 * @param requestContext The request context for the API.
 * @param factoryServiceName The name of the service to use in the routes.
 * @param request The request.
 * @returns The response object with additional http response properties.
 */
export async function nftResolve(
	requestContext: IRequestContext,
	factoryServiceName: string,
	request: INftResolveRequest
): Promise<INftResolveResponse> {
	Guards.object<INftResolveRequest>(ROUTES_SOURCE, nameof(request), request);
	Guards.object<INftResolveRequest["pathParams"]>(
		ROUTES_SOURCE,
		nameof(request.pathParams),
		request.pathParams
	);
	Guards.stringValue(ROUTES_SOURCE, nameof(request.pathParams.id), request.pathParams.id);

	const service = ServiceFactory.get<INft>(factoryServiceName);
	const result = await service.resolve(requestContext, request.pathParams.id);
	return {
		body: result
	};
}

/**
 * Burn an NFT.
 * @param requestContext The request context for the API.
 * @param factoryServiceName The name of the service to use in the routes.
 * @param request The request.
 * @returns The response object with additional http response properties.
 */
export async function nftBurn(
	requestContext: IRequestContext,
	factoryServiceName: string,
	request: INftBurnRequest
): Promise<void> {
	Guards.object<INftBurnRequest>(ROUTES_SOURCE, nameof(request), request);
	Guards.object<INftBurnRequest["pathParams"]>(
		ROUTES_SOURCE,
		nameof(request.pathParams),
		request.pathParams
	);
	Guards.stringValue(ROUTES_SOURCE, nameof(request.pathParams.id), request.pathParams.id);
	Guards.object<INftBurnRequest["body"]>(ROUTES_SOURCE, nameof(request.body), request.body);
	Guards.stringValue(ROUTES_SOURCE, nameof(request.body.owner), request.body.owner);

	const service = ServiceFactory.get<INft>(factoryServiceName);
	await service.burn(requestContext, request.pathParams.id, request.body.owner);
}

/**
 * Transfer an NFT.
 * @param requestContext The request context for the API.
 * @param factoryServiceName The name of the service to use in the routes.
 * @param request The request.
 * @returns The response object with additional http response properties.
 */
export async function nftTransfer(
	requestContext: IRequestContext,
	factoryServiceName: string,
	request: INftTransferRequest
): Promise<void> {
	Guards.object<INftTransferRequest>(ROUTES_SOURCE, nameof(request), request);
	Guards.object<INftTransferRequest["pathParams"]>(
		ROUTES_SOURCE,
		nameof(request.pathParams),
		request.pathParams
	);
	Guards.stringValue(ROUTES_SOURCE, nameof(request.pathParams.id), request.pathParams.id);
	Guards.object<INftTransferRequest["body"]>(ROUTES_SOURCE, nameof(request.body), request.body);
	Guards.stringValue(ROUTES_SOURCE, nameof(request.body.recipient), request.body.recipient);

	const service = ServiceFactory.get<INft>(factoryServiceName);
	await service.transfer(
		requestContext,
		request.pathParams.id,
		request.body.recipient,
		request.body.metadata
	);
}

/**
 * Update an NFT.
 * @param requestContext The request context for the API.
 * @param factoryServiceName The name of the service to use in the routes.
 * @param request The request.
 * @returns The response object with additional http response properties.
 */
export async function nftUpdate(
	requestContext: IRequestContext,
	factoryServiceName: string,
	request: INftUpdateRequest
): Promise<void> {
	Guards.object<INftUpdateRequest>(ROUTES_SOURCE, nameof(request), request);
	Guards.object<INftUpdateRequest["pathParams"]>(
		ROUTES_SOURCE,
		nameof(request.pathParams),
		request.pathParams
	);
	Guards.stringValue(ROUTES_SOURCE, nameof(request.pathParams.id), request.pathParams.id);
	Guards.object<INftUpdateRequest["body"]>(ROUTES_SOURCE, nameof(request.body), request.body);
	Guards.object(ROUTES_SOURCE, nameof(request.body.metadata), request.body.metadata);

	const service = ServiceFactory.get<INft>(factoryServiceName);
	await service.update(requestContext, request.pathParams.id, request.body.metadata);
}
