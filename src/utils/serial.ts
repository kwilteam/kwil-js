import Long from 'long';
import {strings} from "./strings";
import {objects} from "./objects";
import { HexString, NonNil } from './types';

export function StringToBytes(str: string): Uint8Array {
    strings.requireNonNil(str as any);
    const buffer = new ArrayBuffer(str.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < str.length; i++) {
        view[i] = str.charCodeAt(i);
    }
    return view;
}

type AnyObject = {
    [key: string]: any;
}

export function recursivelyHexlify(obj: NonNil<AnyObject>): NonNil<AnyObject> | string {
    if(Array.isArray(obj)) {
        return obj.map(item => recursivelyHexlify(item));
    }

    if(typeof obj === 'object' && obj !== null) {
        const recursiveObj: AnyObject = {};
        for(const key of Object.keys(obj)) {
            recursiveObj[key] = recursivelyHexlify(obj[key]);
        }
        return recursiveObj;
    }

    return anyToHex(obj);
}

export function anyToHex(val: string | number | boolean): string | [] {
    if (typeof val === 'string') {
        // Convert only non-hex strings to hex
        return StringToHex(val);
    } else if (typeof val === 'number') {
        return NumberToHex(val);
    } else if (typeof val === 'boolean') {
        return val ? "0x01" : "0x00";
    } else if (val === null || val === undefined) {
        return [];
    } else {
        // Convert any other value to a string first
        throw new Error(`unknown value: ${val}`);
    }
}


export function StringToHex(str: string): string {
    let hex = '0x';
    for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i);
        hex += code.toString(16).padStart(2, '0'); // Convert the code into a base-16 number and pad with a leading 0 if necessary
    }
    return hex;
}

export function HexToString(hex: HexString): string {
    strings.requireNonNil(hex);
    if (hex.length % 2 !== 0) {
        throw new Error(`invalid hex string: ${hex}`);
    }
    // strip 0x prefix
    if (hex.startsWith('0x')) {
        hex = hex.slice(2);
    }
    let str = '';
    for (let i = 0; i < hex.length; i += 2) {
        const code = parseInt(hex.slice(i, i + 2), 16);
        str += String.fromCharCode(code);
    }
    return str;
}

export function NumberToHex(num: number): HexString {
    let hex = num.toString(16);
    if (hex.length % 2 !== 0) {
        hex = '0' + hex;
    }
    return '0x' + hex;
}

export function HexToNumber(hex: HexString): number {
    strings.requireNonNil(hex);
    if (hex.length % 2 !== 0) {
        throw new Error(`invalid hex string: ${hex}`);
    }
    // strip 0x prefix
    if (hex.startsWith('0x')) {
        hex = hex.slice(2);
    }
    return parseInt(hex, 16);
}

export function BytesToHex(bytes: Uint8Array): HexString {
    return '0x' + bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
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