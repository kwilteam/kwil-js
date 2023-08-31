// noinspection JSPotentiallyInvalidConstructorUsage

import jssha from 'jssha';
import {Signer, SigningKey, ethers, hashMessage, Wallet as Walletv6} from 'ethers';
import {Wallet as Walletv5, Signer as Signerv5, utils} from "ethers5";
import { EthSigner, NearSigner, SignerSupplier } from '../core/builders';
import { bytesToHex, bytesToString, stringToBytes } from './serial';
import { HexString } from './types';
import { bytesToBase64 } from './base64';
import { VerifiedOwner } from '@near-wallet-selector/core'

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

export async function ethSign(message: Uint8Array, signer: EthSigner): Promise<HexString> {
    return await signer.signMessage(message);
}


export async function nearSign(message: Uint8Array, signer: NearSigner): Promise<VerifiedOwner> {
    console.log('SIGNER', signer)
    const sig = (await signer.verifyOwner({
        message: bytesToHex(message),
    }))

    if(!sig) {
        throw new Error('Unable to sign message with near wallet.')
    }

    return sig
}

export function ecrRecoverPubKey(unsignedMessage: Uint8Array, signature: string): string {
    const msgHash = hashMessage(unsignedMessage);
    return SigningKey.recoverPublicKey(msgHash, signature);
}

export async function recoverSecp256k1PubKey(signer: EthSigner): Promise<string> {
    if(signer instanceof Walletv6 || signer instanceof Walletv5 || isV5Signer(signer) || isV6Signer(signer)) {
        const unsignedMessage = 'Sign this message to recover your public key.';
        const signature = await signer.signMessage(unsignedMessage);
        return ecrRecoverPubKey(stringToBytes(unsignedMessage), signature);
        
    }
    
    throw new Error('Signer must be an ethereum signer from Ethers v5 or Ethers v6.');
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
    if(signer instanceof ethers.Wallet || signer instanceof Walletv5 || signer instanceof Signerv5 || isV6Signer(signer)) {
        return true
    }

    return false
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