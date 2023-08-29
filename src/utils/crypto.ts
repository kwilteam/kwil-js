// noinspection JSPotentiallyInvalidConstructorUsage

import jssha from 'jssha';
import {Signer, SigningKey, ethers, hashMessage} from 'ethers';
import {Wallet as Walletv5, Signer as Signerv5, utils} from "ethers5";

export function sha384StringToString(message: string): string {
    // noinspection JSPotentiallyInvalidConstructorUsage
    const shaObj = new jssha('SHA-384', 'TEXT');
    shaObj.update(message);
    return shaObj.getHash('HEX');
}

export function sha384BytesToString(message: Uint8Array): string {
    const shaObj = new jssha('SHA-384', 'UINT8ARRAY');
    shaObj.update(message);
    return shaObj.getHash('HEX');
}

export function sha384BytesToBytes(message: Uint8Array): Uint8Array {
    const shaObj = new jssha('SHA-384', 'UINT8ARRAY');
    shaObj.update(message);
    return shaObj.getHash('UINT8ARRAY');
}

export function sha384StringToBytes(message: string): Uint8Array {
    const shaObj = new jssha('SHA-384', 'TEXT');
    shaObj.update(message);
    return shaObj.getHash('UINT8ARRAY');
}

export function sha224StringToString(message: string): string {
    const shaObj = new jssha('SHA-224', 'TEXT');
    shaObj.update(message);
    return shaObj.getHash('HEX');
}

export async function sign(message: Uint8Array, signer: Signer | ethers.Wallet | Walletv5 | Signerv5): Promise<string> {
    return await signer.signMessage(message);
}

export function ecrRecoverPubKey(unsignedMessage: Uint8Array, signature: string): string {
    const msgHash = hashMessage(unsignedMessage);
    return SigningKey.recoverPublicKey(msgHash, signature);
}

export function isV5Signer(obj: any): obj is Signerv5 {
    return obj
        && typeof obj.getChainId === 'function'
}

export function generateSalt(length: number): Uint8Array {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
        // Browser environment with Web Crypto API
        const salt = new Uint8Array(length);
        const rand = window.crypto.getRandomValues(salt);
        return rand;
    } else if (typeof require !== 'undefined') {
        // Assume Node.js environment
        try {
            const crypto = require('crypto');
            return crypto.randomBytes(length);
        } catch (err) {
            throw new Error('Unable to generate salt in this environment.');
        }
    } else {
        throw new Error('Unsupported environment.');
    }
}