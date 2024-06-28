# Interface: INftMintRequest\<T, U\>

Mint the data and return the NFT id.

## Type parameters

• **T** = `unknown`

• **U** = `unknown`

## Properties

### body

> **body**: `object`

The data to be used in the minting.

#### issuer

> **issuer**: `string`

The issuer for the NFT, will also be the initial owner.

#### tag

> **tag**: `string`

The tag for the NFT.

#### immutableMetadata?

> `optional` **immutableMetadata**: `T`

The immutable metadata for the NFT.

#### metadata?

> `optional` **metadata**: `U`

The metadata for the NFT.

#### namespace?

> `optional` **namespace**: `string`

The namespace of the connector to use for the NFT, defaults to service configured namespace.
