import { NonNil } from './types'
import { ConcatBytes, Marshal, NumberToUint16BigEndian } from './bytes'
import { BytesToHex, HexToBytes, NumberToHex, StringToHex } from './serial'
import { BytesLike, RlpStructuredData, encodeRlp, hexlify, toUtf8Bytes } from 'ethers';
import { bytesToBase64 } from './base64';
import { EncodingType } from '../core/enums';
import util from 'util';

function toRlpStructuredData(input: any): RlpStructuredData {
    if (Array.isArray(input)) {
        return input.map(item => toRlpStructuredData(item));
    } else if (typeof input === 'object' && input !== null) {
        const entries = Object.entries(input);
        const structured: RlpStructuredData[] = [];
        for (const [_, value] of entries) {
            structured.push(toRlpStructuredData(value));
        }
        return structured;
    } else {
        return convertValueToRlp(input);
    }
}

function convertValueToRlp(val: any): string | [] {
    if (typeof val === 'string') {
        // Convert only non-hex strings to hex
        return hexlify(toUtf8Bytes(val));
    } else if (typeof val === 'number') {
        return NumberToHex(val);
    } else if (typeof val === 'boolean') {
        return val ? "0x01" : "0x00";
    } else if (val === null || val === undefined) {
        return [];
    } else {
        // Convert any other value to a string first
        return hexlify(toUtf8Bytes(val.toString()));
    }
}

export function kwilEncode(obj: NonNil<object>): string {
    const rlp: RlpStructuredData = toRlpStructuredData(obj);
    const rlpHex: string = encodeRlp(rlp);
    const rlpBytes: Uint8Array = HexToBytes(rlpHex);
    const encodingType: Uint8Array = NumberToUint16BigEndian(EncodingType.RLP_ENCODING);
    const encodedByteArray = ConcatBytes(encodingType, rlpBytes);
    return bytesToBase64(encodedByteArray);
}