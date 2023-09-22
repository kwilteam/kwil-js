// The GRPC gateway "bytes" type requires base64url encoded strings.

// Convert function to Uint16Array
export function numberToUint16BigEndian(num: number): Uint8Array {
    if (num < 0 || num > 65535 || !Number.isInteger(num)) {
        throw new Error('Number is out of range for uint16');
    }

    const buffer = new ArrayBuffer(2);
    const view = new DataView(buffer);
    view.setUint16(0, num, false); // big endian
    return new Uint8Array(buffer);
}

// Converts a uint8array in uint16 format to a number
export function uint16BigEndianToNumber(uint16: Uint8Array): number {
    if (uint16.length !== 2) {
        throw new Error('uint16 must be 2 bytes');
    }
    const view = new DataView(uint16.buffer);
    return view.getUint16(0, false); // big endian
}

import Long from 'long';

export function numberToUint64LittleEndian(num: number): Uint8Array {
    const longNum = Long.fromNumber(num, true);
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setUint32(0, longNum.low, true);
    view.setUint32(4, longNum.high, true);
    return new Uint8Array(buffer);
}

export function concatBytes(...arrays: Uint8Array[]): Uint8Array {
    let totalLength = 0;
    for (const arr of arrays) {
        totalLength += arr.length;
    }
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const arr of arrays) {
        result.set(arr, offset);
        offset += arr.length;
    }
    return result;
}