# @twin.org/nft-connector-iota-rebased - Examples

## Note

The `start()` method must be called after instantiating the connector and before using any storage methods. This method will:

- Check for an existing package ID in the component state
- If found, verify the package exists on the network
- If not found or verification fails, deploy a new package
- Initialize the connector for use
