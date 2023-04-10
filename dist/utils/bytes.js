"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HexToUint8Array = exports.Uint8ArrayToHex = exports.ConcatBytes = exports.NumberToUint64LittleEndian = exports.StringToUint8LittleEndian = exports.NumberToUint32LittleEndian = exports.MarshalB64 = exports.Marshal = void 0;
const base64Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
// since node and browser have different functions for converting to base64
// Marshal converts an object to a base64url encoded string.
// The GRPC gateway "bytes" type requires base64url encoded strings.
function Marshal(msg) {
    return StringToUint8LittleEndian(JSON.stringify(msg));
}
exports.Marshal = Marshal;
function MarshalB64(msg) {
    return (0, base64_1.bytesToBase64)(Marshal(msg));
}
exports.MarshalB64 = MarshalB64;
// converts a number to a Uint8Array in little endian format
function NumberToUint32LittleEndian(num) {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setUint32(0, num, true);
    return new Uint8Array(buffer);
}
exports.NumberToUint32LittleEndian = NumberToUint32LittleEndian;
function StringToUint8LittleEndian(str) {
    const buffer = new ArrayBuffer(str.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < str.length; i++) {
        view[i] = str.charCodeAt(i);
    }
    return view;
}
exports.StringToUint8LittleEndian = StringToUint8LittleEndian;
const ethers_1 = require("ethers");
const long_1 = __importDefault(require("long"));
const base64_1 = require("./base64");
function NumberToUint64LittleEndian(num) {
    const longNum = long_1.default.fromNumber(num, true);
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setUint32(0, longNum.low, true);
    view.setUint32(4, longNum.high, true);
    return new Uint8Array(buffer);
}
exports.NumberToUint64LittleEndian = NumberToUint64LittleEndian;
function ConcatBytes(...arrays) {
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
exports.ConcatBytes = ConcatBytes;
function Uint8ArrayToHex(uint8Array) {
    return ethers_1.ethers.utils.hexlify(uint8Array);
}
exports.Uint8ArrayToHex = Uint8ArrayToHex;
function HexToUint8Array(hex) {
    return ethers_1.ethers.utils.arrayify(hex);
}
exports.HexToUint8Array = HexToUint8Array;
