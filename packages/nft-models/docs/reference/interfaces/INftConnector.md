# Interface: INftConnector

Interface describing an NFT connector.

## Methods

### mint()

> **mint**\<`T`, `U`\>(`requestContext`, `issuer`, `tag`, `immutableMetadata`, `metadata`): `Promise`\<`string`\>

Mint an NFT.

#### Type parameters

• **T** = `unknown`

• **U** = `unknown`

#### Parameters

• **requestContext**: `IRequestContext`

The context for the request.

• **issuer**: `string`

The issuer for the NFT.

• **tag**: `string`

The tag for the NFT.

• **immutableMetadata**: `undefined` \| `T`

The immutable metadata for the NFT.

• **metadata**: `undefined` \| `U`

The metadata for the NFT.

#### Returns

`Promise`\<`string`\>

The id of the created NFT in urn format.

***

### burn()

> **burn**(`requestContext`, `issuer`, `id`): `Promise`\<`void`\>

Burn an NFT.

#### Parameters

• **requestContext**: `IRequestContext`

The context for the request.

• **issuer**: `string`

The issuer for the NFT to return the funds to.

• **id**: `string`

The id of the NFT to burn in urn format.

#### Returns

`Promise`\<`void`\>

Nothing.

***

### transfer()

> **transfer**(`requestContext`, `id`, `recipient`): `Promise`\<`void`\>

Transfer an NFT.

#### Parameters

• **requestContext**: `IRequestContext`

The context for the request.

• **id**: `string`

The id of the NFT to transfer in urn format.

• **recipient**: `string`

The recipient of the NFT.

#### Returns

`Promise`\<`void`\>

Nothing.
