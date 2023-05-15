import {DataType} from './enums';
import {BytesToInt64, BytesToString, Int64ToBytes, StringToBytes} from '../utils/serial';
import {assertEnumValueUnreachable} from "../utils/typeHelper";

// marshal returns a Uint8Array of the value encoded in the specified type.
// it is prepended with the type byte.
export function marshal(value: number | string | null, type: DataType): Uint8Array {
    switch (type) {
        case DataType.INT: {
            return Uint8Array.of(DataType.INT, ...Int64ToBytes(value as number));
        }
        case DataType.TEXT: {
            return Uint8Array.of(DataType.TEXT, ...StringToBytes(value as string));
        }
        case DataType.NULL: {
            return Uint8Array.of(DataType.NULL);
        }
        case DataType.INVALID_TYPE: {
            throw new Error("INVALID_TYPE cannot be marshaled");
        }
    }

    return assertEnumValueUnreachable(type);
}

export function unmarshal(bytes: Uint8Array): any {
    const type = bytes[0] as DataType;
    switch (type) {
        case DataType.INT:
            return BytesToInt64(bytes.slice(1));
        case DataType.TEXT:
            return BytesToString(bytes.slice(1));
        case DataType.NULL:
        case DataType.INVALID_TYPE:
            return null;
    }

    return assertEnumValueUnreachable(type);
}

