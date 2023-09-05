import { SigningKey, Wallet as Walletv6, hashMessage } from "ethers";
import { EthSigner, NearSigner, SignerSupplier } from "../core/builders";
import { from_b58 } from "./base58";
import { bytesToHex, stringToBytes } from "./serial";
import { HexString } from "./types";
import { utils } from "near-api-js";
import { Wallet as Walletv5, Signer as Signerv5 } from "ethers5";

// Public Keys
export function isNearPubKey(pubKey: string): boolean {
    return pubKey.startsWith('ed25519:');
}

function trimNearPrefix(str: string): string {
    return str.replace('ed25519:', '')
}

export function nearB58ToHex(b58: string): string {
    b58 = trimNearPrefix(b58);
    const b58Bytes = from_b58(b58);
    if(!b58Bytes) {
        throw new Error(`invalid base58 string: ${b58}`);
    }
    return bytesToHex(b58Bytes).slice(2);
}

export async function recoverSecp256k1PubKey(signer: EthSigner): Promise<string> {
    if(signer instanceof Walletv6 || signer instanceof Walletv5 || isV5Signer(signer) || isV6Signer(signer)) {
        const unsignedMessage = 'Sign this message to recover your public key.';
        const signature = await signer.signMessage(unsignedMessage);
        return ecrRecoverPubKey(stringToBytes(unsignedMessage), signature);
    }
    
    throw new Error('Signer must be an ethereum signer from Ethers v5 or Ethers v6.');
}

export function ecrRecoverPubKey(unsignedMessage: Uint8Array, signature: string): string {
    const msgHash = hashMessage(unsignedMessage);
    return SigningKey.recoverPublicKey(msgHash, signature);
}

// Signers
export async function nearSign(message: Uint8Array, signer: NearSigner, config: NearConfig): Promise<NearSignature> {
    const sig = await signer.signMessage(message, config.accountId, config.networkId);

    return sig
}

export async function ethSign(message: Uint8Array, signer: EthSigner): Promise<HexString> {
    return await signer.signMessage(message);
}

interface NearSignature {
    signature: Uint8Array;
    publicKey: utils.PublicKey
}

export interface NearConfig {
    accountId: string;
    networkId: string;
}

export function isV5Signer(obj: any): obj is Signerv5 {
    return obj
        && typeof obj.getChainId === 'function'
}

export function isV6Signer(obj: any): boolean {
    return obj
        && typeof obj.getChainId === 'function'
        && typeof obj.connect === 'function'
        && typeof obj.signMessage === 'function'
}

export function isEthersSigner(signer: SignerSupplier): boolean {
    if(signer instanceof Walletv6 || signer instanceof Walletv5 || signer instanceof Signerv5 || isV6Signer(signer)) {
        return true
    }

    return false
}