export type ValueType = string | number | null;

export enum DataType {
    NULL = "NULL",
    TEXT = "TEXT",
    INT = "INT"
}

export enum AttributeType {
    PRIMARY_KEY = "PRIMARY_KEY",
    UNIQUE = "UNIQUE",
    NOT_NULL = "NOT_NULL",
    DEFAULT = "DEFAULT",
    MIN = "MIN",
    MAX = "MAX",
    MIN_LENGTH = "MIN_LENGTH",
    MAX_LENGTH = "MAX_LENGTH"
}


export enum IndexType {
    BTREE = "BTREE",
    UNIQUE_BTREE = "UNIQUE_BTREE"
}