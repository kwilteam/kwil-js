import { HexString } from "../utils/types";
import { CustomSigner, EthSigner, SignerSupplier } from "./builders";
import { AnySignatureType, SignatureType, getSignatureType } from "./signature";

/**
 * The `KwilSigner` class is a utility class for storing a signer and its associated public key. It is used to sign transactions and messages on Kwil.
 */
export class KwilSigner {
    /** The signer, which can be of type `EthSigner` or `CustomSigner` */
    public readonly signer: EthSigner | CustomSigner;

    /** The public key associated with the signer */
    public readonly publicKey: HexString | Uint8Array;

    /** The type of the signature. */
    public readonly signatureType: AnySignatureType;

    /**
     * Creates a new instance of KwilSigner using an EthSigner.
     * 
     * @param {EthSigner} signer - A signer from Ethers v5 or Ethers v6.
     * @param {HexString | Uint8Array} publicKey - The public key associated with the signer. Can be a hex string or bytes (Uint8Array).
     */
    constructor(signer: EthSigner, publicKey: HexString | Uint8Array);

    /**
     * Creates a new instance of KwilSigner using a CustomSigner with a specified signature type.
     * 
     * @param {CustomSigner} signer - An instance of CustomSigner.
     * @param {HexString | Uint8Array} publicKey - The public key associated with the signer. Can be a hex string or bytes (Uint8Array).
     * @param {AnySignatureType} signatureType - The type of the signature. Can be from the SignatureType enum or a custom string for the signer name, if implemented on the Kwil network.
     */
    constructor(signer: CustomSigner, publicKey: HexString | Uint8Array, signatureType: AnySignatureType);

    /**
     * Actual implementation of the KwilSigner constructor.
     * 
     * @param {SignerSupplier} signer - Either an instance of EthSigner or CustomSigner.
     * @param {HexString | Uint8Array} publicKey - The public key associated with the signer. Can be a hex string or bytes (Uint8Array).
     * @param {AnySignatureType} signatureType - (Optional) The type of the signature. If not provided, 
     *                        the signature type is determined from the signer.
     */
    constructor(signer: SignerSupplier, publicKey: HexString | Uint8Array, signatureType?: AnySignatureType) {
        this.signer = signer;
        this.publicKey = publicKey;
        if (signatureType) {
            this.signatureType = signatureType;
        } else {
            this.signatureType = getSignatureType(signer);
            if(this.signatureType === SignatureType.SIGNATURE_TYPE_INVALID) {
                throw new Error("Could not determine signature type from signer. Please pass a signature type to the KwilSigner constructor.");
            }
    }}
} 