import { SigningKey, hashMessage } from "ethers";
import { EthSigner } from "../core/builders";
import { from_b58 } from "./base58";
import { bytesToHex, stringToBytes } from "./serial";
import { isEthersSigner } from "../core/signature";

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
    return bytesToHex(b58Bytes);
}

/**
 * Recover a secp256k1 public key from a signer. This will force the user to sign a message.
 * 
 * @param signer - An ethereum signer from Ethers v5 or Ethers v6.
 * @param message - The message to sign. Defaults to 'Sign this message to recover your public key.'.
 * @returns A promise that resolves to the recovered public key.
 * @deprecated No longer supported. Ethereum accounts are now identified by their address. (will be removed in v0.5.0)
 */

export async function recoverSecp256k1PubKey(signer: EthSigner, message: string = 'Sign this message to recover your public key.'): Promise<string> {
    if(isEthersSigner(signer)) {
        const signature = await signer.signMessage(message);
        return ecrRecoverPubKey(stringToBytes(message), signature);
    }
    
    throw new Error('Signer must be an ethereum signer from Ethers v5 or Ethers v6.');
}

export function ecrRecoverPubKey(unsignedMessage: Uint8Array, signature: string): string {
    const msgHash = hashMessage(unsignedMessage);
    return SigningKey.recoverPublicKey(msgHash, signature);
}