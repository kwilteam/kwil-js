import { NonNil } from './types'
import { ConcatBytes, Marshal, NumberToUint16BigEndian } from './bytes'
import { BytesToHex, HexToBytes, NumberToHex, StringToHex } from './serial'
import { BytesLike, RlpStructuredData, encodeRlp, hexlify, toUtf8Bytes } from 'ethers';
import { bytesToBase64 } from './base64';
import { EncodingType } from '../core/enums';

function isRlpEncodable(value: any): boolean {
    if (typeof value === 'string' || typeof value === 'number' || value === null) {
        return true;
    }

    return false;
}

function extractRlpEncodable(value: NonNil<{ [key: string]: any } | any[]>): RlpStructuredData {
    let result: RlpStructuredData[] = [];

    const keys = Array.isArray(value) ? value.map((_, idx) => idx.toString()) : Object.keys(value);
    
    for (const key of keys.sort()) {
        const val = Array.isArray(value) ? value[Number(key)] : value[key];

        // If val is another object or array, recurse into it
        if ((typeof val === 'object' && val !== null) || Array.isArray(val)) {
            result.push([StringToHex(val), extractRlpEncodable(val)]);
            continue; // Skip the remaining logic for this iteration
        }

        if (isRlpEncodable(val)) {
            if (typeof val === 'string') {
                result.push([StringToHex(key), StringToHex(val)]);
            } else if (typeof val === 'number') {
                result.push(StringToHex(key), NumberToHex(val));
            }
        } 
    }

    return result;
}

function toRlpStructuredData(input: any): RlpStructuredData {
    if (Array.isArray(input)) {
        return input.map(item => toRlpStructuredData(item));
    } else if (typeof input === 'object' && input !== null) {
        const entries = Object.entries(input);
        return entries.map(([key, value]) => [toRlpStructuredData(key), toRlpStructuredData(value)]);
    } else {
        return convertValueToRlp(input);
    }
}

function convertValueToRlp(val: any): string {
    if (typeof val === 'string') {
        // Convert only non-hex strings to hex
        return hexlify(toUtf8Bytes(val));
    } else if (typeof val === 'number') {
        return val.toString(16);
    } else if (val === null || val === undefined) {
        return '0x';
    } else {
        // Convert any other value to a string first
        return hexlify(toUtf8Bytes(val.toString()));
    }
}

export function kwilEncode(obj: NonNil<object>): string {
    // const uint8: Uint8Array = Marshal(obj);
    // const rlp: string = '0x' + BytesToHex(uint8);
    const rlp: RlpStructuredData = toRlpStructuredData(obj);
    console.log('rlp', rlp)
    const rlpHex: string = encodeRlp(rlp);
    console.log('rlpHex', rlpHex)
    const rlpBytes: Uint8Array = HexToBytes(rlpHex);
    console.log('rlpBytes', rlpBytes)
    const encodingType: Uint8Array = NumberToUint16BigEndian(EncodingType.RLP_ENCODING);
    const encodedByteArray = ConcatBytes(encodingType, rlpBytes);
    return bytesToBase64(encodedByteArray);
}