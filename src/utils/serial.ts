import Long from 'long';
import {strings} from "./strings";
import {objects} from "./objects";

export function StringToBytes(str: string): Uint8Array {
    strings.requireNonNil(str as any);
    const buffer = new ArrayBuffer(str.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < str.length; i++) {
        view[i] = str.charCodeAt(i);
    }
    return view;
}

export function StringToHex(str: string): string {
    let hex = '0x';
    for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i);
        hex += code.toString(16).padStart(2, '0'); // Convert the code into a base-16 number and pad with a leading 0 if necessary
    }
    return hex;
}

export function NumberToHex(num: number): string {
    let hex = num.toString(16);
    if (hex.length % 2 !== 0) {
        hex = '0' + hex;
    }
    return '0x' + hex;
}

export function BytesToHex(bytes: Uint8Array): string {
    return bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
}

export function HexToBytes(hex: string): Uint8Array {
    strings.requireNonNil(hex);
    if (hex.length % 2 !== 0) {
        throw new Error(`invalid hex string: ${hex}`);
    }

    // strip 0x prefix
    if (hex.startsWith('0x')) {
        hex = hex.slice(2);
    }

    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
    }
    return bytes;
}

export function BytesToString(bytes: Uint8Array): string {
    objects.requireNonNil(bytes);
    let string = '';
    for (let i = 0; i < bytes.length; i++) {
        string += String.fromCharCode(bytes[i]);
    }
    return string;
}

export function Int32ToBytes(num: number): Uint8Array {
    objects.requireNonNilNumber(num);
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setInt32(0, num, true);
    return new Uint8Array(buffer);
}

export function BytesToInt32(bytes: Uint8Array): number {
    objects.requireNonNil(bytes);
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    for (let i = 0; i < bytes.length; i++) {
        view.setInt8(i, bytes[i]);
    }
    return view.getInt32(0, true);
}

export function Int64ToBytes(num: number): Uint8Array {
    objects.requireNonNilNumber(num);
    const longNum = Long.fromNumber(num, true);
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setInt32(0, longNum.low, true);
    view.setInt32(4, longNum.high, true);
    return new Uint8Array(buffer);
}

export function BytesToInt64(bytes: Uint8Array): number {
    objects.requireNonNil(bytes);
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    for (let i = 0; i < bytes.length; i++) {
        view.setInt8(i, bytes[i]);
    }
    return view.getInt32(0, true);
}

export function BooleanToBytes(bool: boolean): Uint8Array {
    objects.requireNonNil(bool);
    const buffer = new ArrayBuffer(1);
    const view = new DataView(buffer);
    view.setUint8(0, bool ? 1 : 0);
    return new Uint8Array(buffer);
}

export function BytesToBoolean(bytes: Uint8Array): boolean {
    objects.requireNonNil(bytes);
    const buffer = new ArrayBuffer(1);
    const view = new DataView(buffer);
    for (let i = 0; i < bytes.length; i++) {
        view.setUint8(i, bytes[i]);
    }
    return view.getUint8(0) === 1;
}