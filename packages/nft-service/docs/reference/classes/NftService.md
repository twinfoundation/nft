# Class: NftService

Service for performing NFT operations to a connector.

## Implements

- `INft`

## Constructors

### new NftService()

> **new NftService**(`config`?): [`NftService`](NftService.md)

Create a new instance of NftService.

#### Parameters

• **config?**: [`INftServiceConfig`](../interfaces/INftServiceConfig.md)

The configuration for the service.

#### Returns

[`NftService`](NftService.md)

## Methods

### mint()

> **mint**\<`T`, `U`\>(`requestContext`, `issuer`, `tag`, `immutableMetadata`?, `metadata`?, `options`?): `Promise`\<`string`\>

Mint an NFT.

#### Type parameters

• **T** = `unknown`

• **U** = `unknown`

#### Parameters

• **requestContext**: `IRequestContext`

The context for the request.

• **issuer**: `string`

The issuer for the NFT, will also be the initial owner.

• **tag**: `string`

The tag for the NFT.

• **immutableMetadata?**: `T`

The immutable metadata for the NFT.

• **metadata?**: `U`

The metadata for the NFT.

• **options?**

Additional options for the NFT service.

• **options.namespace?**: `string`

The namespace of the connector to use for the NFT, defaults to service configured namespace.

#### Returns

`Promise`\<`string`\>

The id of the created NFT in urn format.

#### Implementation of

`INft.mint`

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

#### Implementation of

`INft.resolve`

***

### burn()

> **burn**(`requestContext`, `owner`, `id`): `Promise`\<`void`\>

Burn an NFT.

#### Parameters

• **requestContext**: `IRequestContext`

The context for the request.

• **owner**: `string`

The owner for the NFT to return the funds to.

• **id**: `string`

The id of the NFT to burn in urn format.

#### Returns

`Promise`\<`void`\>

Nothing.

#### Implementation of

`INft.burn`

***

### transfer()

> **transfer**\<`T`\>(`requestContext`, `id`, `recipient`, `metadata`?): `Promise`\<`void`\>

Transfer an NFT.

#### Type parameters

• **T** = `unknown`

#### Parameters

• **requestContext**: `IRequestContext`

The context for the request.

• **id**: `string`

The id of the NFT to transfer in urn format.

• **recipient**: `string`

The recipient of the NFT.

• **metadata?**: `T`

Optional mutable data to include during the transfer.

#### Returns

`Promise`\<`void`\>

Nothing.

#### Implementation of

`INft.transfer`

***

### update()

> **update**\<`T`\>(`requestContext`, `id`, `metadata`): `Promise`\<`void`\>

Update the data of the NFT.

#### Type parameters

• **T** = `unknown`

#### Parameters

• **requestContext**: `IRequestContext`

The context for the request.

• **id**: `string`

The id of the NFT to update in urn format.

• **metadata**: `T`

The mutable data to update.

#### Returns

`Promise`\<`void`\>

Nothing.

#### Implementation of

`INft.update`
