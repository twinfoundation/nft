// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { GeneralError, Guards, Urn } from "@gtsc/core";
import { nameof } from "@gtsc/nameof";
import { NftConnectorFactory, type INftComponent, type INftConnector } from "@gtsc/nft-models";
import type { INftServiceConfig } from "./models/INftServiceConfig";

/**
 * Service for performing NFT operations to a connector.
 */
export class NftService implements INftComponent {
	/**
	 * The namespace supported by the nft service.
	 */
	public static readonly NAMESPACE: string = "nft";

	/**
	 * Runtime name for the class.
	 */
	public readonly CLASS_NAME: string = nameof<NftService>();

	/**
	 * The default namespace for the connector to use.
	 * @internal
	 */
	private readonly _defaultNamespace: string;

	/**
	 * Create a new instance of NftService.
	 * @param config The configuration for the service.
	 */
	constructor(config?: INftServiceConfig) {
		const names = NftConnectorFactory.names();
		if (names.length === 0) {
			throw new GeneralError(this.CLASS_NAME, "noConnectors");
		}

		this._defaultNamespace = config?.defaultNamespace ?? names[0];
	}

	/**
	 * Mint an NFT.
	 * @param issuer The issuer for the NFT, will also be the initial owner.
	 * @param tag The tag for the NFT.
	 * @param immutableMetadata The immutable metadata for the NFT.
	 * @param metadata The metadata for the NFT.
	 * @param namespace The namespace of the connector to use for the NFT, defaults to service configured namespace.
	 * @param identity The identity to perform the nft operation on.
	 * @returns The id of the created NFT in urn format.
	 */
	public async mint<T = unknown, U = unknown>(
		issuer: string,
		tag: string,
		immutableMetadata?: T,
		metadata?: U,
		namespace?: string,
		identity?: string
	): Promise<string> {
		Guards.stringValue(this.CLASS_NAME, nameof(issuer), issuer);
		Guards.stringValue(this.CLASS_NAME, nameof(tag), tag);
		Guards.stringValue(this.CLASS_NAME, nameof(identity), identity);

		try {
			const connectorNamespace = namespace ?? this._defaultNamespace;

			const nftConnector = NftConnectorFactory.get<INftConnector>(connectorNamespace);

			const nftUrn = await nftConnector.mint(identity, issuer, tag, immutableMetadata, metadata);

			return nftUrn;
		} catch (error) {
			throw new GeneralError(this.CLASS_NAME, "mintFailed", undefined, error);
		}
	}

	/**
	 * Resolve an NFT.
	 * @param id The id of the NFT to resolve.
	 * @param identity The identity to perform the nft operation on.
	 * @returns The data for the NFT.
	 */
	public async resolve<T = unknown, U = unknown>(
		id: string,
		identity?: string
	): Promise<{
		issuer: string;
		owner: string;
		tag: string;
		immutableMetadata?: T;
		metadata?: U;
	}> {
		Urn.guard(this.CLASS_NAME, nameof(id), id);

		try {
			const nftConnector = this.getConnector(id);
			return nftConnector.resolve(id);
		} catch (error) {
			throw new GeneralError(this.CLASS_NAME, "resolveFailed", undefined, error);
		}
	}

	/**
	 * Burn an NFT.
	 * @param id The id of the NFT to burn in urn format.
	 * @param identity The identity to perform the nft operation on.
	 * @returns Nothing.
	 */
	public async burn(id: string, identity?: string): Promise<void> {
		Urn.guard(this.CLASS_NAME, nameof(id), id);
		Guards.stringValue(this.CLASS_NAME, nameof(identity), identity);

		try {
			const nftConnector = this.getConnector(id);
			await nftConnector.burn(identity, id);
		} catch (error) {
			throw new GeneralError(this.CLASS_NAME, "burnFailed", undefined, error);
		}
	}

	/**
	 * Transfer an NFT.
	 * @param id The id of the NFT to transfer in urn format.
	 * @param recipient The recipient of the NFT.
	 * @param metadata Optional mutable data to include during the transfer.
	 * @param identity The identity to perform the nft operation on.
	 * @returns Nothing.
	 */
	public async transfer<T = unknown>(
		id: string,
		recipient: string,
		metadata?: T,
		identity?: string
	): Promise<void> {
		Urn.guard(this.CLASS_NAME, nameof(id), id);
		Guards.stringValue(this.CLASS_NAME, nameof(recipient), recipient);
		Guards.stringValue(this.CLASS_NAME, nameof(identity), identity);

		try {
			const nftConnector = this.getConnector(id);
			await nftConnector.transfer(identity, id, recipient, metadata);
		} catch (error) {
			throw new GeneralError(this.CLASS_NAME, "transferFailed", undefined, error);
		}
	}

	/**
	 * Update the data of the NFT.
	 * @param id The id of the NFT to update in urn format.
	 * @param metadata The mutable data to update.
	 * @param identity The identity to perform the nft operation on.
	 * @returns Nothing.
	 */
	public async update<T = unknown>(id: string, metadata: T, identity?: string): Promise<void> {
		Urn.guard(this.CLASS_NAME, nameof(id), id);
		Guards.object(this.CLASS_NAME, nameof(metadata), metadata);
		Guards.stringValue(this.CLASS_NAME, nameof(identity), identity);

		try {
			const nftConnector = this.getConnector(id);
			await nftConnector.update(identity, id, metadata);
		} catch (error) {
			throw new GeneralError(this.CLASS_NAME, "updateFailed", undefined, error);
		}
	}

	/**
	 * Get the connector from the uri.
	 * @param id The id of the NFT in urn format.
	 * @returns The connector.
	 * @internal
	 */
	private getConnector(id: string): INftConnector {
		const idUri = Urn.fromValidString(id);

		if (idUri.namespaceIdentifier() !== NftService.NAMESPACE) {
			throw new GeneralError(this.CLASS_NAME, "namespaceMismatch", {
				namespace: NftService.NAMESPACE,
				id
			});
		}

		return NftConnectorFactory.get<INftConnector>(idUri.namespaceMethod());
	}
}
