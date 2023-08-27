import { HexString, NonNil } from './types'
import { ConcatBytes, NumberToUint16BigEndian } from './bytes'
import { BytesToHex, HexToBytes, NumberToHex, StringToHex, anyToHex } from './serial'
import { RlpStructuredData, encodeRlp } from 'ethers';
import { EncodingType } from '../core/enums';
import { encode } from '@ethereumjs/rlp';

function _objToNestedArray(input: NonNil<object>): any[] | HexString {
    if (Array.isArray(input) && !(input instanceof Uint8Array)) {
        return input.map(item => _objToNestedArray(item));
    } else if (typeof input === 'object' && input !== null && !(input instanceof Uint8Array)) {
        const entries = Object.entries(input);
        const structured: RlpStructuredData[] = [];
        for (const [_, value] of entries) {
            structured.push(_objToNestedArray(value));
        }
        return structured;
    } else {
        return inputToHex(input);
    }
}

// takes any input and returns it as a hex string
function inputToHex(val: string | number | BigInt | Uint8Array | Boolean | null | undefined): HexString {
    if (typeof val === 'string') {
        // Convert only non-hex strings to hex
        return StringToHex(val);
    } else if (typeof val === 'number' || typeof val === 'bigint') {
        const num = Number(val);
        if (num === 0) {
            return "0x"; // special case for RLP encoding 0
        }
        return NumberToHex(num);
    } else if (val instanceof Uint8Array) {
        return BytesToHex(val);
    } else if (typeof val === 'boolean') {
        return val ? "0x01" : "0x00";
    } else if (val === null || val === undefined) {
        return BytesToHex(new Uint8Array(0));
    } else {
        // Convert any other value to a string first
        throw new Error(`unknown value: ${val}`);
    }
}

export function kwilEncode(obj: NonNil<object>): Uint8Array {
    const rlp: RlpStructuredData = _objToNestedArray(obj);
    console.log(rlp)
    const rlpBytes: HexString = encodeRlp(rlp); // returned as hex string
    const encodingType: Uint8Array = NumberToUint16BigEndian(EncodingType.RLP_ENCODING);
    return ConcatBytes(encodingType, HexToBytes(rlpBytes));
}