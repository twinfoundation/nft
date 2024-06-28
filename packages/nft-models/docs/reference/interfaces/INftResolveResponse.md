# Interface: INftResolveResponse\<T, U\>

Response to resolving the NFT.

## Type parameters

• **T** = `unknown`

• **U** = `unknown`

## Properties

### body

> **body**: `object`

The data that was resolved.

#### issuer

> **issuer**: `string`

The issuer of the NFT.

#### owner

> **owner**: `string`

The owner of the NFT.

#### tag

> **tag**: `string`

The tag data for the NFT.

#### immutableMetadata?

> `optional` **immutableMetadata**: `T`

The immutable data for the NFT.

#### metadata?

> `optional` **metadata**: `U`

The metadata for the NFT.
