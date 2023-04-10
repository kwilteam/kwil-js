"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncodedValueFromBase64 = exports.EncodedValueFromBytes = exports.EncodedValue = void 0;
const marshal_1 = require("./marshal");
const base64_1 = require("../utils/base64");
class EncodedValue {
    constructor(value, type) {
        this.value = value;
        this.type = type;
        this.bytes = (0, marshal_1.marshal)(value, type);
    }
    Value() {
        return this.value;
    }
    Type() {
        return this.type;
    }
    Bytes() {
        return this.bytes;
    }
    Base64() {
        return (0, base64_1.bytesToBase64)(this.bytes);
    }
}
exports.EncodedValue = EncodedValue;
function EncodedValueFromBytes(bytes) {
    let val = (0, marshal_1.unmarshal)(bytes);
    let type = bytes[0];
    return new EncodedValue(val, type);
}
exports.EncodedValueFromBytes = EncodedValueFromBytes;
function EncodedValueFromBase64(base64) {
    let bytes = (0, base64_1.base64ToBytes)(base64);
    return EncodedValueFromBytes(bytes);
}
exports.EncodedValueFromBase64 = EncodedValueFromBase64;
