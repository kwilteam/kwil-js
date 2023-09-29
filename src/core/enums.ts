export type ValueType = string | number | null;

export enum DataType {
    NULL = "",
    TEXT = "TEXT",
    INT = "INT"
}

export enum AttributeType {
    INVALID_TYPE = "",
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
    INVALID_INDEX_TYPE = "",
    BTREE = "BTREE",
    UNIQUE_BTREE = "UNIQUE_BTREE"
}

export enum EncodingType {
    INVALID_ENCODING_TYPE = 0,
    RLP_ENCODING
}

export enum PayloadType {
    INVALID_PAYLOAD_TYPE = 'invalid',
    DEPLOY_DATABASE = 'deploy_schema',
    DROP_DATABASE = 'drop_schema',
    EXECUTE_ACTION = 'execute_action',
    CALL_ACTION = 'call_action',
}

export enum SerializationType {
    INVALID_SERIALIZATION_TYPE = 'invalid',
    SIGNED_MSG_CONCAT = 'concat',
    SIGNED_MSG_EIP712 = 'eip712',
}