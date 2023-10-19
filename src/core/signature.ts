import { Base64String, HexString, Nillable } from "../utils/types";
import { EthSigner, SignerSupplier } from "./builders";
import { Wallet as Walletv5, Signer as Signerv5 } from "ethers5";
import { Wallet as Walletv6 } from "ethers";
import { hexToBytes } from "../utils/serial";
import { BytesEncodingStatus, PayloadBytesTypes } from "./enums";

export interface Signature<T extends PayloadBytesTypes> {
    signature_bytes: Nillable<T extends BytesEncodingStatus.BASE64_ENCODED ? Base64String : Uint8Array>;
    signature_type: SignatureType;
}

export enum SignatureType {
    SIGNATURE_TYPE_INVALID = 'invalid',
	SECP256K1_PERSONAL = 'secp256k1_ep',
    ED25519_NEAR = 'ed25519_nr',
    ED25519 = 'ed25519'
}

export type CustomSignatureType = string;

export type AnySignatureType = SignatureType | CustomSignatureType;

export function getSignatureType(signer: SignerSupplier): SignatureType {
    if(isEthersSigner(signer))  {
        return SignatureType.SECP256K1_PERSONAL;
    }

    return SignatureType.SIGNATURE_TYPE_INVALID;
}

async function ethSign(message: Uint8Array, signer: EthSigner): Promise<HexString> {
    return await signer.signMessage(message);
}

export function isV5Signer(obj: any): obj is Signerv5 {
    return obj
        && typeof obj.getChainId === 'function'
}

export function isV6Signer(obj: any): boolean {
    return obj
        && typeof obj.address === 'string'
}

export function isEthersSigner(signer: SignerSupplier): boolean {
    if(signer instanceof Walletv6 || signer instanceof Walletv5 || signer instanceof Signerv5 || isV6Signer(signer)) {
        return true
    }

    return false
}

export async function executeSign(msg: Uint8Array , signer: SignerSupplier, signatureType: AnySignatureType): Promise<Uint8Array> {
    if(isEthersSigner(signer) && signatureType === SignatureType.SECP256K1_PERSONAL) {
        const hexSig =  await ethSign(msg, signer as EthSigner);
        return hexToBytes(hexSig);
    }

    if(!isEthersSigner(signer) && signatureType !== SignatureType.SIGNATURE_TYPE_INVALID) {
        if(typeof signer === 'function') {
            const signature = await signer(msg);
            return signature;
        } else {
            throw new Error("Something went wrong signing! Make sure your signer is a function that returns a Uint8Array.")
        }
    }

    throw new Error("Could not execute signature. Make sure you pass a signer from EtherJS or a function that returns a Uint8Array.");
}