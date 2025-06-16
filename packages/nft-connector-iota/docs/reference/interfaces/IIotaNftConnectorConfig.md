# Interface: IIotaNftConnectorConfig

Configuration for the IOTA NFT Connector.

## Extends

- `IIotaConfig`

## Properties

### contractName?

> `optional` **contractName**: `string`

The name of the contract to use.

#### Default

```ts
"nft"
```

***

### packageControllerAddressIndex?

> `optional` **packageControllerAddressIndex**: `number`

The package controller address index to use when creating package.

#### Default

```ts
0
```

***

### walletAddressIndex?

> `optional` **walletAddressIndex**: `number`

The wallet address index to use when creating NFT.

#### Default

```ts
0
```

***

### enableCostLogging?

> `optional` **enableCostLogging**: `boolean`

Enable cost logging.

#### Default

```ts
false
```
