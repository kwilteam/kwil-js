// noinspection JSPotentiallyInvalidConstructorUsage

import jssha from 'jssha';
import {Signer, SigningKey, ethers, getBytes, hashMessage, id, recoverAddress} from 'ethers';
import { Signature, SignatureType } from '../core/signature';
import {  HexToUint8Array,  } from './bytes';
import { base64ToBytes, bytesToBase64 } from './base64';
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

function encodeSignature(signature: string): string {
    return bytesToBase64(HexToUint8Array(signature));
}

export function buildSignaturePayload(message: string): Signature {
    return {
        signature_bytes: encodeSignature(message),
        signature_type: SignatureType.SECP256K1_PERSONAL,
    };
}
export async function sign(message: string, signer: Signer | ethers.Wallet | Walletv5 | Signerv5): Promise<string> {
    return await signer.signMessage(base64ToBytes(message));
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
        return window.crypto.getRandomValues(salt);
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