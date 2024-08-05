// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type {
	ICreatedResponse,
	IHttpRequestContext,
	INoContentResponse,
	IRestRoute,
	ITag
} from "@gtsc/api-models";
import { Guards } from "@gtsc/core";
import { nameof } from "@gtsc/nameof";
import type {
	INft,
	INftBurnRequest,
	INftMintRequest,
	INftResolveRequest,
	INftResolveResponse,
	INftTransferRequest,
	INftUpdateRequest
} from "@gtsc/nft-models";
import { ServiceFactory } from "@gtsc/services";
import { HttpStatusCode } from "@gtsc/web";

/**
 * The source used when communicating about these routes.
 */
const ROUTES_SOURCE = "nftRoutes";

/**
 * The tag to associate with the routes.
 */
export const tagsNft: ITag[] = [
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
export function generateRestRoutesNft(
	baseRouteName: string,
	factoryServiceName: string
): IRestRoute[] {
	const mintRoute: IRestRoute<INftMintRequest, ICreatedResponse> = {
		operationId: "nftMint",
		summary: "Mint an NFT",
		tag: tagsNft[0].name,
		method: "POST",
		path: `${baseRouteName}/`,
		handler: async (httpRequestContext, request) =>
			nftMint(httpRequestContext, factoryServiceName, request),
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
				type: nameof<ICreatedResponse>(),
				examples: [
					{
						id: "nftMintResponseExample",
						response: {
							statusCode: HttpStatusCode.created,
							headers: {
								location:
									"nft:iota:aW90YS1uZnQ6dHN0OjB4NzYyYjljNDllYTg2OWUwZWJkYTliYmZhNzY5Mzk0NDdhNDI4ZGNmMTc4YzVkMTVhYjQ0N2UyZDRmYmJiNGViMg=="
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
		tag: tagsNft[0].name,
		method: "GET",
		path: `${baseRouteName}/:id`,
		handler: async (httpRequestContext, request) =>
			nftResolve(httpRequestContext, factoryServiceName, request),
		requestType: {
			type: nameof<INftResolveRequest>(),
			examples: [
				{
					id: "nftResolveExample",
					request: {
						pathParams: {
							id: "nft:iota:aW90YS1uZnQ6dHN0OjB4NzYyYjljNDllYTg2OWUwZWJkYTliYmZhNzY5Mzk0NDdhNDI4ZGNmMTc4YzVkMTVhYjQ0N2UyZDRmYmJiNGViMg=="
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

	const burnRoute: IRestRoute<INftBurnRequest, INoContentResponse> = {
		operationId: "nftBurn",
		summary: "Burn an NFT",
		tag: tagsNft[0].name,
		method: "DELETE",
		path: `${baseRouteName}/:id`,
		handler: async (httpRequestContext, request) =>
			nftBurn(httpRequestContext, factoryServiceName, request),
		requestType: {
			type: nameof<INftBurnRequest>(),
			examples: [
				{
					id: "nftBurnExample",
					request: {
						pathParams: {
							id: "nft:iota:aW90YS1uZnQ6dHN0OjB4NzYyYjljNDllYTg2OWUwZWJkYTliYmZhNzY5Mzk0NDdhNDI4ZGNmMTc4YzVkMTVhYjQ0N2UyZDRmYmJiNGViMg=="
						}
					}
				}
			]
		},
		responseType: [
			{
				type: nameof<INoContentResponse>()
			}
		]
	};

	const transferRoute: IRestRoute<INftTransferRequest, INoContentResponse> = {
		operationId: "nftTransfer",
		summary: "Transfer an NFT",
		tag: tagsNft[0].name,
		method: "POST",
		path: `${baseRouteName}/:id/transfer`,
		handler: async (httpRequestContext, request) =>
			nftTransfer(httpRequestContext, factoryServiceName, request),
		requestType: {
			type: nameof<INftTransferRequest>(),
			examples: [
				{
					id: "nftTransferExample",
					request: {
						pathParams: {
							id: "nft:iota:aW90YS1uZnQ6dHN0OjB4NzYyYjljNDllYTg2OWUwZWJkYTliYmZhNzY5Mzk0NDdhNDI4ZGNmMTc4YzVkMTVhYjQ0N2UyZDRmYmJiNGViMg=="
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
		},
		responseType: [
			{
				type: nameof<INoContentResponse>()
			}
		]
	};

	const updateRoute: IRestRoute<INftUpdateRequest, INoContentResponse> = {
		operationId: "nftUpdate",
		summary: "Update an NFT",
		tag: tagsNft[0].name,
		method: "PUT",
		path: `${baseRouteName}/:id`,
		handler: async (httpRequestContext, request) =>
			nftUpdate(httpRequestContext, factoryServiceName, request),
		requestType: {
			type: nameof<INftUpdateRequest>(),
			examples: [
				{
					id: "nftUpdateExample",
					request: {
						pathParams: {
							id: "nft:iota:aW90YS1uZnQ6dHN0OjB4NzYyYjljNDllYTg2OWUwZWJkYTliYmZhNzY5Mzk0NDdhNDI4ZGNmMTc4YzVkMTVhYjQ0N2UyZDRmYmJiNGViMg=="
						},
						body: {
							metadata: {
								data: "AAAAA"
							}
						}
					}
				}
			]
		},
		responseType: [
			{
				type: nameof<INoContentResponse>()
			}
		]
	};

	return [mintRoute, resolveRoute, burnRoute, transferRoute, updateRoute];
}

/**
 * Mint an NFT.
 * @param httpRequestContext The request context for the API.
 * @param factoryServiceName The name of the service to use in the routes.
 * @param request The request.
 * @returns The response object with additional http response properties.
 */
export async function nftMint(
	httpRequestContext: IHttpRequestContext,
	factoryServiceName: string,
	request: INftMintRequest
): Promise<ICreatedResponse> {
	Guards.object<INftMintRequest>(ROUTES_SOURCE, nameof(request), request);
	Guards.object<INftMintRequest["body"]>(ROUTES_SOURCE, nameof(request.body), request.body);
	Guards.stringValue(ROUTES_SOURCE, nameof(request.body.issuer), request.body.issuer);
	Guards.stringValue(ROUTES_SOURCE, nameof(request.body.tag), request.body.tag);
	const service = ServiceFactory.get<INft>(factoryServiceName);
	const id = await service.mint(
		request.body.issuer,
		request.body.tag,
		request.body.immutableMetadata,
		request.body.metadata,
		{
			namespace: request.body.namespace
		},
		httpRequestContext.userIdentity
	);
	return {
		statusCode: HttpStatusCode.created,
		headers: {
			location: id
		}
	};
}

/**
 * Resolve an NFT.
 * @param httpRequestContext The request context for the API.
 * @param factoryServiceName The name of the service to use in the routes.
 * @param request The request.
 * @returns The response object with additional http response properties.
 */
export async function nftResolve(
	httpRequestContext: IHttpRequestContext,
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
	const result = await service.resolve(request.pathParams.id, httpRequestContext.userIdentity);
	return {
		body: result
	};
}

/**
 * Burn an NFT.
 * @param httpRequestContext The request context for the API.
 * @param factoryServiceName The name of the service to use in the routes.
 * @param request The request.
 * @returns The response object with additional http response properties.
 */
export async function nftBurn(
	httpRequestContext: IHttpRequestContext,
	factoryServiceName: string,
	request: INftBurnRequest
): Promise<INoContentResponse> {
	Guards.object<INftBurnRequest>(ROUTES_SOURCE, nameof(request), request);
	Guards.object<INftBurnRequest["pathParams"]>(
		ROUTES_SOURCE,
		nameof(request.pathParams),
		request.pathParams
	);
	Guards.stringValue(ROUTES_SOURCE, nameof(request.pathParams.id), request.pathParams.id);

	const service = ServiceFactory.get<INft>(factoryServiceName);
	await service.burn(request.pathParams.id, httpRequestContext.userIdentity);

	return {
		statusCode: HttpStatusCode.noContent
	};
}

/**
 * Transfer an NFT.
 * @param httpRequestContext The request context for the API.
 * @param factoryServiceName The name of the service to use in the routes.
 * @param request The request.
 * @returns The response object with additional http response properties.
 */
export async function nftTransfer(
	httpRequestContext: IHttpRequestContext,
	factoryServiceName: string,
	request: INftTransferRequest
): Promise<INoContentResponse> {
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
		request.pathParams.id,
		request.body.recipient,
		request.body.metadata,
		httpRequestContext.userIdentity
	);

	return {
		statusCode: HttpStatusCode.noContent
	};
}

/**
 * Update an NFT.
 * @param httpRequestContext The request context for the API.
 * @param factoryServiceName The name of the service to use in the routes.
 * @param request The request.
 * @returns The response object with additional http response properties.
 */
export async function nftUpdate(
	httpRequestContext: IHttpRequestContext,
	factoryServiceName: string,
	request: INftUpdateRequest
): Promise<INoContentResponse> {
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
	await service.update(
		request.pathParams.id,
		request.body.metadata,
		httpRequestContext.userIdentity
	);

	return {
		statusCode: HttpStatusCode.noContent
	};
}
