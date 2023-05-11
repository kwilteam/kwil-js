export type ValueType = string | number | null;

export enum DataType {
    INVALID_TYPE = 100,
    NULL,
    TEXT,
    INT
}

export enum AttributeType {
    INVALID_ATTRIBUTE_TYPE = 100,
    PRIMARY_KEY,
    UNIQUE,
    NOT_NULL,
    DEFAULT,
    MIN,
    MAX,
    MIN_LENGTH,
    MAX_LENGTH
}

export enum IndexType {
    INVALID_INDEX_TYPE = 100,
    BTREE,
    UNIQUE_BTREE
}

// TODO: The logic below should be cleaned up to not allow invalid values to be returned.

export function DataTypeEnumToInteger(enumValue: DataType | string): number {
    /*
        Javascript passes enums as strings and this does not get caught by the compiler.
        This function will convert the enum to an integer even if it is a string.
    */

    if (typeof enumValue === "string") {
        switch (enumValue) {
            case "INVALID_TYPE":
                return 100;
            case "NULL":
                return 101;
            case "TEXT":
                return 102;
            case "INT":
                return 103;
            default:
                console.log("Invalid enum value: " + enumValue)
                return 0;
        }
    }
    switch (enumValue) {
        case DataType.INVALID_TYPE:
            return 100;
        case DataType.NULL:
            return 101;
        case DataType.TEXT:
            return 102;
        case DataType.INT:
            return 103;
        default:
            console.log("Invalid enum value: " + enumValue)
            return 0;
    }
}

export function DataTypeToString(dataType: DataType): string {
    switch (DataTypeEnumToInteger(dataType)) {
        case DataType.INVALID_TYPE:
            return "INVALID_TYPE";
        case DataType.NULL:
            return "NULL";
        case DataType.TEXT:
            return "TEXT";
        case DataType.INT:
            return "INT";
        default:
            throw new Error("cannot convert data type to string: unknown type: " + dataType);
    }
}

export function inputToDataType(input: string | number | null): DataType {
    if (input === null) {
        return DataType.NULL;
    }

    if (typeof input === "string") {
        return DataType.TEXT;
    }

    if (typeof (input as any) === "number") {
        return DataType.INT;
    }

    return DataType.INVALID_TYPE;
}