// noinspection JSPotentiallyInvalidConstructorUsage

import jssha from 'jssha';

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

export function sha256BytesToBytes(message: Uint8Array): Uint8Array {
    const shaObj = new jssha('SHA-256', 'UINT8ARRAY');
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

export function sha224BytesToString(message: Uint8Array): string {
    const shaObj = new jssha('SHA-224', 'UINT8ARRAY');
    shaObj.update(message);
    return shaObj.getHash('HEX');
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