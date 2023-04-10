export declare enum DataType {
    INVALID_TYPE = 100,
    NULL = 101,
    TEXT = 102,
    INT = 103
}
export declare enum AttributeType {
    INVALID_ATTRIBUTE_TYPE = 100,
    PRIMARY_KEY = 101,
    UNIQUE = 102,
    NOT_NULL = 103,
    DEFAULT = 104,
    MIN = 105,
    MAX = 106,
    MIN_LENGTH = 107,
    MAX_LENGTH = 108
}
export declare enum IndexType {
    INVALID_INDEX_TYPE = 100,
    BTREE = 101,
    UNIQUE_BTREE = 102
}
export declare function DataTypeEnumToInteger(enumValue: DataType | string): number;
export declare function DataTypeToString(dataType: DataType): string;
export declare function inputToDataType(input: string | number | null): DataType;
