module 0x0::nft {
    use iota::object::{Self, UID};
    use iota::transfer;
    use iota::tx_context::TxContext;
    use std::string::String;

    /// The NFT struct representing our NFT object.
    struct NFT has key, store {
        id: UID,
        name: String,
        description: String,
        uri: String,
        tag: String,
        metadata: String, // Mutable metadata
        issuer: address,
    }

    /// Mint a new NFT and transfer it to the issuer.
    public entry fun mint(
        name: String,
        description: String,
        uri: String,
        tag: String,
        issuer: address,
        metadata: String,
        ctx: &mut TxContext
    ) {
        let nft = NFT {
            id: object::new(ctx),
            name,
            description,
            uri,
            tag,
            metadata,
            issuer,
        };
        transfer::transfer(nft, issuer);
    }

    /// Update the mutable metadata of the NFT.
    public entry fun update_metadata(nft: &mut NFT, new_metadata: String) {
        nft.metadata = new_metadata;
    }

    /// Transfer with metadata update
    public entry fun transfer_with_metadata(
        nft: NFT, // Take ownership directly
        recipient: address,
        metadata: String
    ) {
        update_metadata(&mut nft, metadata);

        transfer::public_transfer(nft, recipient);
    }

    /// Burn the NFT.
    public entry fun burn(nft: NFT) {
        let NFT {
            id,
            name: _,
            description: _,
            uri: _,
            tag: _,
            metadata: _,
            issuer: _
        } = nft;
        object::delete(id);
    }
}
