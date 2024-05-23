# Interface: INftConnector

Interface describing an NFT connector.

## Methods

### mint()

> **mint**\<`T`, `U`\>(`requestContext`, `tag`, `metadata`, `immutableMetadata`): `Promise`\<`string`\>

Mint an NFT.

#### Type parameters

• **T** = `unknown`

• **U** = `unknown`

#### Parameters

• **requestContext**: `IRequestContext`

The context for the request.

• **tag**: `string`

The tag for the NFT.

• **metadata**: `undefined` \| `T`

The metadata for the NFT.

• **immutableMetadata**: `undefined` \| `U`

The immutable metadata for the NFT.

#### Returns

`Promise`\<`string`\>

The id of the created NFT.
