const base64Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// since node and browser have different functions for converting to base64

// Marshal converts an object to a base64url encoded string.
// The GRPC gateway "bytes" type requires base64url encoded strings.
export function Marshal(msg: object): Uint8Array {
    return StringToUint8LittleEndian(JSON.stringify(msg));
}

export function MarshalB64(msg: object): string {
    return bytesToBase64(Marshal(msg))
}

// converts a number to a Uint8Array in little endian format
export function NumberToUint32LittleEndian(num: number): Uint8Array {
  const buffer = new ArrayBuffer(4);
  const view = new DataView(buffer);
  view.setUint32(0, num, true);
  return new Uint8Array(buffer);
}

export function StringToUint8LittleEndian(str: string): Uint8Array {
  const buffer = new ArrayBuffer(str.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < str.length; i++) {
      view[i] = str.charCodeAt(i);
  }
  return view;
}

import { ethers } from 'ethers';
import Long from 'long';
import { bytesToBase64 } from './base64';

export function NumberToUint64LittleEndian(num: number): Uint8Array {
    const longNum = Long.fromNumber(num, true);
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setUint32(0, longNum.low, true);
    view.setUint32(4, longNum.high, true);
    return new Uint8Array(buffer);
}

export function ConcatBytes(...arrays: Uint8Array[]): Uint8Array {
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

export function Uint8ArrayToHex(uint8Array: Uint8Array): string {
   return  ethers.utils.hexlify(uint8Array);
}

export function HexToUint8Array(hex: string): Uint8Array {
  return  ethers.utils.arrayify(hex);
}