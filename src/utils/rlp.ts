import { HexString, NonNil } from './types'
import { ConcatBytes, NumberToUint16BigEndian } from './bytes'
import { HexToBytes } from './serial'
import { RlpStructuredData, encodeRlp } from 'ethers';
import { EncodingType } from '../core/enums';
import { encode } from '@ethereumjs/rlp';

function _objToNestedArray(input: NonNil<object>): any[] {
    if (Array.isArray(input)) {
        return input.map(item => _objToNestedArray(item));
    } else if (typeof input === 'object' && input !== null) {
        const entries = Object.entries(input);
        const structured: RlpStructuredData[] = [];
        for (const [_, value] of entries) {
            structured.push(_objToNestedArray(value));
        }
        return structured;
    } else {
        return input;
    }
}

export function kwilEncode(obj: NonNil<object>): Uint8Array {
    const rlp: RlpStructuredData = _objToNestedArray(obj);
    console.log(rlp)
    const rlpBytes: Uint8Array = encode(rlp);
    const encodingType: Uint8Array = NumberToUint16BigEndian(EncodingType.RLP_ENCODING);
    return ConcatBytes(encodingType, rlpBytes);
}