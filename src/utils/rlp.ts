import { NonNil } from './types'
import { ConcatBytes, NumberToUint16BigEndian } from './bytes'
import { HexToBytes } from './serial'
import { RlpStructuredData, encodeRlp } from 'ethers';
import { EncodingType } from '../core/enums';

function _objToNestedArray(input: NonNil<object>): RlpStructuredData {
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
    const rlpHex: string = encodeRlp(rlp);
    const rlpBytes: Uint8Array = HexToBytes(rlpHex);
    const encodingType: Uint8Array = NumberToUint16BigEndian(EncodingType.RLP_ENCODING);
    return ConcatBytes(encodingType, rlpBytes);
}