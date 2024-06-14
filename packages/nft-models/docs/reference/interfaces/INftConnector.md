# Interface: INftConnector

Interface describing an NFT connector.

## Methods

### mint()

> **mint**\<`T`, `U`\>(`requestContext`, `issuerAddress`, `tag`, `immutableMetadata`?, `metadata`?): `Promise`\<`string`\>

Mint an NFT.

#### Type parameters

• **T** = `unknown`

• **U** = `unknown`

#### Parameters

• **requestContext**: `IRequestContext`

The context for the request.

• **issuerAddress**: `string`

The issuer address for the NFT, will also be the owner address.

• **tag**: `string`

The tag for the NFT.

• **immutableMetadata?**: `T`

The immutable metadata for the NFT.

• **metadata?**: `U`

The metadata for the NFT.

#### Returns

`Promise`\<`string`\>

The id of the created NFT in urn format.

***

### resolve()

> **resolve**\<`T`, `U`\>(`requestContext`, `id`): `Promise`\<`object`\>

Resolve an NFT.

#### Type parameters

• **T** = `unknown`

• **U** = `unknown`

#### Parameters

• **requestContext**: `IRequestContext`

The context for the request.

• **id**: `string`

The id of the NFT to resolve.

#### Returns

`Promise`\<`object`\>

The data for the NFT.

##### issuer

> **issuer**: `string`

##### owner

> **owner**: `string`

##### tag

> **tag**: `string`

##### immutableMetadata?

> `optional` **immutableMetadata**: `T`

##### metadata?

> `optional` **metadata**: `U`

***

### burn()

> **burn**(`requestContext`, `ownerAddress`, `id`): `Promise`\<`void`\>

Burn an NFT.

#### Parameters

• **requestContext**: `IRequestContext`

The context for the request.

• **ownerAddress**: `string`

The issuer address for the NFT to return the funds to.

• **id**: `string`

The id of the NFT to burn in urn format.

#### Returns

`Promise`\<`void`\>

Nothing.

***

### transfer()

> **transfer**(`requestContext`, `id`, `recipientAddress`): `Promise`\<`void`\>

Transfer an NFT.

#### Parameters

• **requestContext**: `IRequestContext`

The context for the request.

• **id**: `string`

The id of the NFT to transfer in urn format.

• **recipientAddress**: `string`

The recipient address of the NFT.

#### Returns

`Promise`\<`void`\>

Nothing.
