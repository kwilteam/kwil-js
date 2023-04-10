"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BytesToBoolean = exports.BooleanToBytes = exports.BytesToInt64 = exports.Int64ToBytes = exports.BytesToInt32 = exports.Int32ToBytes = exports.BytesToString = exports.StringToBytes = void 0;
const long_1 = __importDefault(require("long"));
function StringToBytes(str) {
    const buffer = new ArrayBuffer(str.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < str.length; i++) {
        view[i] = str.charCodeAt(i);
    }
    return view;
}
exports.StringToBytes = StringToBytes;
function BytesToString(bytes) {
    let string = '';
    for (let i = 0; i < bytes.length; i++) {
        string += String.fromCharCode(bytes[i]);
    }
    return string;
}
exports.BytesToString = BytesToString;
function Int32ToBytes(num) {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setInt32(0, num, true);
    return new Uint8Array(buffer);
}
exports.Int32ToBytes = Int32ToBytes;
function BytesToInt32(bytes) {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    for (let i = 0; i < bytes.length; i++) {
        view.setInt8(i, bytes[i]);
    }
    return view.getInt32(0, true);
}
exports.BytesToInt32 = BytesToInt32;
function Int64ToBytes(num) {
    const longNum = long_1.default.fromNumber(num, true);
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setInt32(0, longNum.low, true);
    view.setInt32(4, longNum.high, true);
    return new Uint8Array(buffer);
}
exports.Int64ToBytes = Int64ToBytes;
function BytesToInt64(bytes) {
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    for (let i = 0; i < bytes.length; i++) {
        view.setInt8(i, bytes[i]);
    }
    return view.getInt32(0, true);
}
exports.BytesToInt64 = BytesToInt64;
function BooleanToBytes(bool) {
    const buffer = new ArrayBuffer(1);
    const view = new DataView(buffer);
    view.setUint8(0, bool ? 1 : 0);
    return new Uint8Array(buffer);
}
exports.BooleanToBytes = BooleanToBytes;
function BytesToBoolean(bytes) {
    const buffer = new ArrayBuffer(1);
    const view = new DataView(buffer);
    for (let i = 0; i < bytes.length; i++) {
        view.setUint8(i, bytes[i]);
    }
    return view.getUint8(0) === 1;
}
exports.BytesToBoolean = BytesToBoolean;
