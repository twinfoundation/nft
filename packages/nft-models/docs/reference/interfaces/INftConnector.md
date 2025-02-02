# Interface: INftConnector

Interface describing an NFT connector.

## Extends

- `IComponent`

## Methods

### mint()

> **mint**\<`T`, `U`\>(`controller`, `issuerAddress`, `tag`, `immutableMetadata`?, `metadata`?): `Promise`\<`string`\>

Mint an NFT.

#### Type Parameters

• **T** = `unknown`

• **U** = `unknown`

#### Parameters

##### controller

`string`

The identity of the user to access the vault keys.

##### issuerAddress

`string`

The issuer for the NFT, will also be the initial owner.

##### tag

`string`

The tag for the NFT.

##### immutableMetadata?

`T`

The immutable metadata for the NFT.

##### metadata?

`U`

The metadata for the NFT.

#### Returns

`Promise`\<`string`\>

The id of the created NFT in urn format.

***

### resolve()

> **resolve**\<`T`, `U`\>(`id`): `Promise`\<\{ `issuer`: `string`; `owner`: `string`; `tag`: `string`; `immutableMetadata`: `T`; `metadata`: `U`; \}\>

Resolve an NFT.

#### Type Parameters

• **T** = `unknown`

• **U** = `unknown`

#### Parameters

##### id

`string`

The id of the NFT to resolve.

#### Returns

`Promise`\<\{ `issuer`: `string`; `owner`: `string`; `tag`: `string`; `immutableMetadata`: `T`; `metadata`: `U`; \}\>

The data for the NFT.

***

### burn()

> **burn**(`controller`, `id`): `Promise`\<`void`\>

Burn an NFT.

#### Parameters

##### controller

`string`

The controller of the NFT who can make changes.

##### id

`string`

The id of the NFT to burn in urn format.

#### Returns

`Promise`\<`void`\>

Nothing.

***

### transfer()

> **transfer**\<`T`\>(`controller`, `id`, `recipient`, `metadata`?): `Promise`\<`void`\>

Transfer an NFT.

#### Type Parameters

• **T** = `unknown`

#### Parameters

##### controller

`string`

The controller of the NFT who can make changes.

##### id

`string`

The id of the NFT to transfer in urn format.

##### recipient

`string`

The recipient of the NFT.

##### metadata?

`T`

Optional mutable data to include during the transfer.

#### Returns

`Promise`\<`void`\>

Nothing.

***

### update()

> **update**\<`T`\>(`controller`, `id`, `metadata`): `Promise`\<`void`\>

Update the mutable data of the NFT.

#### Type Parameters

• **T** = `unknown`

#### Parameters

##### controller

`string`

The controller of the NFT who can make changes.

##### id

`string`

The id of the NFT to update in urn format.

##### metadata

`T`

The mutable data to update.

#### Returns

`Promise`\<`void`\>

Nothing.
