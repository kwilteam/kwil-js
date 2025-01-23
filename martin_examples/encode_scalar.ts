import { parse, validate } from 'uuid';
import { booleanToBytes, numberToBytes, stringToBytes } from "../src/utils/serial";

type UUID = string

type Scalar = string | number | null | undefined | boolean | Uint8Array | UUID


export function encodeScalar(s: Scalar): Uint8Array {
    // handle uuid case
    if (typeof s === 'string' && validate(s)) {
        return encodeNotNull(parse(s))
    }

    // handle null case
    if (s === null) {
        return encodeNull();
    }

    // handle Uint8Array case
    if (s instanceof Uint8Array) {
        return encodeNotNull(s)
    }

    // handle decimal case
    if (typeof s === 'number' && isDecimal(s)) {
        return encodeNotNull(stringToBytes(s.toString()))
    }

    // handle other scalar value cases
    switch(typeof s) {
        case 'string':
            return encodeNotNull(stringToBytes(s));
        case 'boolean':
            return encodeNotNull(booleanToBytes(s));
        case 'number':
            return encodeNotNull(numberToBytes(s));
        case 'undefined':
            return encodeNull()
        case 'bigint':
            throw new Error('bigint not supported. convert to string.')
        default:
            throw new Error ('invalid scalar value')
    }
}

function encodeNull(): Uint8Array {
    return new Uint8Array([0])
}

function encodeNotNull(v: Uint8Array): Uint8Array {
    const bytes = new Uint8Array(v.length + 1)
    bytes[0] = 1
    bytes.set(v, 1)
    return bytes;
}

function isDecimal(n: number): boolean {
    const numStr = Math.abs(n).toString();
    const decimalIdx = numStr.indexOf('.');
    return decimalIdx !== -1;
}