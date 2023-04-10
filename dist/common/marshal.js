"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unmarshal = exports.marshal = void 0;
const enums_1 = require("./interfaces/enums");
const serialize_1 = require("./serial/serialize");
// marshal returns a Uint8Array of the value encoded in the specified type.
// it is prepended with the type byte.
function marshal(value, type) {
    var arr;
    const dType = (0, enums_1.DataTypeToString)(type);
    switch (dType) {
        case "INT":
            if (typeof value != "number") {
                throw new Error("value is not a number, it is a " + typeof value);
            }
            arr = new Uint8Array(9);
            arr[0] = (0, enums_1.DataTypeEnumToInteger)(type);
            arr.set((0, serialize_1.Int64ToBytes)(value), 1);
            return arr;
        case "TEXT":
            if (typeof value != "string") {
                throw new Error("value is not a string it is a " + typeof value);
            }
            arr = new Uint8Array(1 + value.length);
            arr[0] = (0, enums_1.DataTypeEnumToInteger)(type);
            arr.set((0, serialize_1.StringToBytes)(value), 1);
            return arr;
        case "NULL":
            arr = new Uint8Array(1);
            arr[0] = (0, enums_1.DataTypeEnumToInteger)(type);
            return arr;
        default:
            throw new Error("unknown type: " + dType);
    }
}
exports.marshal = marshal;
function unmarshal(bytes) {
    switch (bytes[0]) {
        case enums_1.DataType.INT:
            return (0, serialize_1.BytesToInt64)(bytes.slice(1));
        case enums_1.DataType.TEXT:
            return (0, serialize_1.BytesToString)(bytes.slice(1));
        case enums_1.DataType.NULL:
            return null;
        default:
            return null;
    }
}
exports.unmarshal = unmarshal;
