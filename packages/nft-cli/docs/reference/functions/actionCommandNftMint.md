# Function: actionCommandNftMint()

> **actionCommandNftMint**(`opts`): `Promise`\<`void`\>

Action the nft mint command.

## Parameters

• **opts**

The options for the command.

• **opts.seed**: `string`

The seed required for signing by the issuer.

• **opts.issuer**: `string`

The issuer address of the NFT.

• **opts.tag**: `string`

The tag for the NFT.

• **opts.immutableJson?**: `string`

Filename of the immutable JSON data.

• **opts.mutableJson?**: `string`

Filename of the mutable JSON data.

• **opts.console**: `boolean`

Flag to display on the console.

• **opts.json?**: `string`

Output the data to a JSON file.

• **opts.mergeJson**: `boolean`

Merge the data to a JSON file.

• **opts.env?**: `string`

Output the data to an environment file.

• **opts.mergeEnv**: `boolean`

Merge the data to an environment file.

• **opts.node**: `string`

The node URL.

• **opts.explorer**: `string`

The explorer URL.

## Returns

`Promise`\<`void`\>
