# Interface: INftComponent

Interface describing an NFT component.

## Extends

- `IComponent`

## Methods

### mint()

> **mint**\<`T`, `U`\>(`issuer`, `tag`, `immutableMetadata`?, `metadata`?, `namespace`?, `identity`?): `Promise`\<`string`\>

Mint an NFT.

#### Type Parameters

• **T** = `unknown`

• **U** = `unknown`

#### Parameters

##### issuer

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

##### namespace?

`string`

The namespace of the connector to use for the NFT, defaults to component configured namespace.

##### identity?

`string`

The identity to perform the nft operation on.

#### Returns

`Promise`\<`string`\>

The id of the created NFT in urn format.

***

### resolve()

> **resolve**\<`T`, `U`\>(`id`, `identity`?): `Promise`\<\{ `issuer`: `string`; `owner`: `string`; `tag`: `string`; `immutableMetadata`: `T`; `metadata`: `U`; \}\>

Resolve an NFT.

#### Type Parameters

• **T** = `unknown`

• **U** = `unknown`

#### Parameters

##### id

`string`

The id of the NFT to resolve.

##### identity?

`string`

The identity to perform the nft operation on.

#### Returns

`Promise`\<\{ `issuer`: `string`; `owner`: `string`; `tag`: `string`; `immutableMetadata`: `T`; `metadata`: `U`; \}\>

The data for the NFT.

***

### burn()

> **burn**(`id`, `identity`?): `Promise`\<`void`\>

Burn an NFT.

#### Parameters

##### id

`string`

The id of the NFT to burn in urn format.

##### identity?

`string`

The identity to perform the nft operation on.

#### Returns

`Promise`\<`void`\>

Nothing.

***

### transfer()

> **transfer**\<`T`\>(`id`, `recipient`, `metadata`?, `identity`?): `Promise`\<`void`\>

Transfer an NFT.

#### Type Parameters

• **T** = `unknown`

#### Parameters

##### id

`string`

The id of the NFT to transfer in urn format.

##### recipient

`string`

The recipient of the NFT.

##### metadata?

`T`

Optional mutable data to include during the transfer.

##### identity?

`string`

The identity to perform the nft operation on.

#### Returns

`Promise`\<`void`\>

Nothing.

***

### update()

> **update**\<`T`\>(`id`, `metadata`, `identity`?): `Promise`\<`void`\>

Update the mutable data of the NFT.

#### Type Parameters

• **T** = `unknown`

#### Parameters

##### id

`string`

The id of the NFT to update in urn format.

##### metadata

`T`

The mutable data to update.

##### identity?

`string`

The identity to perform the nft operation on.

#### Returns

`Promise`\<`void`\>

Nothing.
