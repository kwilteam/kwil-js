import { HexString, NonNil } from './types'
import { concatBytes, numberToUint16BigEndian, uint16BigEndianToNumber } from './bytes'
import { bytesToEthHex, hexToBytes, numberToEthHex, stringToEthHex, hexToString } from './serial'
import { RlpStructuredData, decodeRlp, encodeRlp } from 'ethers';
import { EncodingType } from '../core/enums';

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
        return stringToEthHex(val);
    } else if (typeof val === 'number' || typeof val === 'bigint') {
        const num = Number(val);
        if (num === 0) {
            return "0x"; // special case for RLP encoding 0
        }
        return numberToEthHex(num);
    } else if (val instanceof Uint8Array) {
        return bytesToEthHex(val);
    } else if (typeof val === 'boolean') {
        return val ? "0x01" : "0x00";
    } else if (val === null || val === undefined) {
        return bytesToEthHex(new Uint8Array(0));
    } else {
        // Convert any other value to a string first
        throw new Error(`unknown type for value: ${val}`);
    }
}

export function kwilEncode(obj: NonNil<object>): Uint8Array {
    const rlp: RlpStructuredData = _objToNestedArray(obj);
    const rlpBytes: HexString = encodeRlp(rlp); // returned as hex string
    const encodingType: Uint8Array = numberToUint16BigEndian(EncodingType.RLP_ENCODING);
    return concatBytes(encodingType, hexToBytes(rlpBytes));
}

export function kwilDecode(encoding: Uint8Array): any {
    const encodingBytes: Uint8Array = encoding.slice(0, 2);
    const encodingType = uint16BigEndianToNumber(encodingBytes);

    // check if encoding type exists in the enum
    if (!Object.values(EncodingType).includes(encodingType)) {
        throw new Error(`unknown encoding type: ${encodingType}`);
    }

    const rlpBytes: Uint8Array = encoding.slice(2);
    const rlpHex: HexString = bytesToEthHex(rlpBytes);
    const rlp: RlpStructuredData = decodeRlp(rlpHex);

    return _recursivelyDeHexlify(rlp);
}

type KwilRlpDecoded = string | number | boolean ;

function _recursivelyDeHexlify(obj: RlpStructuredData): KwilRlpDecoded | any[] {
    if(Array.isArray(obj)) {
        return obj.map((item) => {
            return _recursivelyDeHexlify(item);
        });
    }
    return _convertDecodedType(hexToString(obj));
}

function _convertDecodedType(val: string): KwilRlpDecoded {
    if (!isNaN(Number(val))){
        return Number(val);
    }

    if (val === 'true') {
        return true;
    }

    if (val === 'false') {
        return false;
    }

    return val;
}