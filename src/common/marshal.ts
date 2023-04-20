import { DataType, DataTypeEnumToInteger, DataTypeToString } from './interfaces/enums';
import { Int64ToBytes, StringToBytes, BytesToInt64, BytesToString } from './serial/serialize';

// marshal returns a Uint8Array of the value encoded in the specified type.
// it is prepended with the type byte.
export function marshal(value: any, type: DataType): Uint8Array {
    var arr: Uint8Array;
    const dType = DataTypeToString(type) as string;
    switch (dType) {
        case "INT":
            if (typeof value != "number") {
                throw new Error("value is not a number, it is a " + typeof value);
            }
            arr = new Uint8Array(9);
            arr[0] = DataTypeEnumToInteger(type);
            arr.set(Int64ToBytes(value), 1);
            return arr;
        case "TEXT":
            if (typeof value != "string") {
                throw new Error("value is not a string it is a " + typeof value);
            }
            arr = new Uint8Array(1 + value.length);
            arr[0] = DataTypeEnumToInteger(type);
            arr.set(StringToBytes(value), 1);
            return arr;
        case "NULL":
            arr = new Uint8Array(1);
            arr[0] = DataTypeEnumToInteger(type);
            return arr;
        default:
            throw new Error("unknown type: " + dType)
    }
}

export function unmarshal(bytes: Uint8Array): any {
    switch (bytes[0]) {
        case DataType.INT:
            return BytesToInt64(bytes.slice(1));
        case DataType.TEXT:
            return BytesToString(bytes.slice(1));
        case DataType.NULL:
            return null;
        default:
            return null;
    }
}