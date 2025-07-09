module 0x0::nft {
    use iota::object::{Self, UID};
    use iota::transfer;
    use iota::tx_context::TxContext;
    use std::string::String;

    /// The NFT struct representing our NFT object.
    struct NFT has key, store {
        id: UID,
        immutable_metadata: String, // All immutable data as JSON,
        tag: String,
        metadata: String, // Mutable metadata
        issuer: address,
        issuerIdentity: String,
        ownerIdentity: String
    }

    /// Mint a new NFT and transfer it to the issuer.
    public entry fun mint(
        immutable_metadata: String,
        tag: String,
        issuer: address,
        metadata: String,
        issuerIdentity: String,
        ownerIdentity: String,
        ctx: &mut TxContext
    ) {
        let nft = NFT {
            id: object::new(ctx),
            immutable_metadata,
            tag,
            metadata,
            issuer,
            issuerIdentity,
            ownerIdentity
        };
        transfer::transfer(nft, issuer);
    }

    /// Update the mutable metadata of the NFT.
    public entry fun update_metadata(nft: &mut NFT, new_metadata: String) {
        nft.metadata = new_metadata;
    }

    /// Transfer without metadata update
    public entry fun transfer(
        nft: NFT, // Take ownership directly
        recipient: address,
        recipientIdentity: String
    ) {
        nft.ownerIdentity = recipientIdentity;

        transfer::public_transfer(nft, recipient);
    }

    /// Transfer with metadata update
    public entry fun transfer_with_metadata(
        nft: NFT, // Take ownership directly
        recipient: address,
        recipientIdentity: String,
        metadata: String
    ) {
        nft.ownerIdentity = recipientIdentity;

        update_metadata(&mut nft, metadata);

        transfer::public_transfer(nft, recipient);
    }

    /// Burn the NFT.
    public entry fun burn(nft: NFT) {
        let NFT {
            id,
            immutable_metadata: _,
            tag: _,
            metadata: _,
            issuer: _,
            issuerIdentity: _,
            ownerIdentity: _
        } = nft;
        object::delete(id);
    }
}
