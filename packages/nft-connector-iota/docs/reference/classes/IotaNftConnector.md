# Class: IotaNftConnector

Class for performing NFT operations on IOTA.

## Implements

- `INftConnector`

## Constructors

### new IotaNftConnector()

> **new IotaNftConnector**(): [`IotaNftConnector`](IotaNftConnector.md)

#### Returns

[`IotaNftConnector`](IotaNftConnector.md)

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

#### Implementation of

`INftConnector.mint`
