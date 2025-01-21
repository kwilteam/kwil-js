/**
 * ValueType is the type of the data in the database.
 *
 * If you are sending bytes to a blob column, you must send it as a Uint8Array. If you send a string to blob column, it will be converted to base64.
 */
export type ValueType =
  | string
  | number
  | null
  | undefined
  | Array<ValueType>
  | boolean
  | Uint8Array;

/**
 * VarType is the type of the data in the database.
 *
 * Although Kwil supports text, int, bool, blob, uuid, uint256, decimal, and null types, kwil-js only supports text, int, bool, decimal, and null. If you need to send blob, uuid, or uint256 types, you should send them as a javascript string.
 *
 */
export enum VarType {
  UUID = 'uuid',
  TEXT = 'text',
  INT = 'int',
  INT8 = 'int8',
  BOOL = 'bool',
  DECIMAL = 'decimal', // Old: now use numeric instead but keeping for compatibility
  NUMERIC = 'numeric',
  NULL = 'null',
  BLOB = 'blob', // Old: now use bytea but keeping for compatibility
  BYTEA = 'bytea',
  UNKNOWN = 'unknown',
}

export enum AttributeType {
  INVALID_TYPE = '',
  PRIMARY_KEY = 'PRIMARY_KEY',
  UNIQUE = 'UNIQUE',
  NOT_NULL = 'NOT_NULL',
  DEFAULT = 'DEFAULT',
  MIN = 'MIN',
  MAX = 'MAX',
  MIN_LENGTH = 'MIN_LENGTH',
  MAX_LENGTH = 'MAX_LENGTH',
}

export enum IndexType {
  INVALID_INDEX_TYPE = '',
  BTREE = 'BTREE',
  UNIQUE_BTREE = 'UNIQUE_BTREE',
}

export enum EncodingType {
  INVALID_ENCODING_TYPE = 0,
  RLP_ENCODING,
}

export enum PayloadType {
  INVALID_PAYLOAD_TYPE = 'invalid',
  DEPLOY_DATABASE = 'deploy_schema',
  DROP_DATABASE = 'drop_schema',
  EXECUTE_ACTION = 'execute',
  CALL_ACTION = 'call_action',
  TRANSFER = 'transfer',
}

export type DeployOrDrop = PayloadType.DEPLOY_DATABASE | PayloadType.DROP_DATABASE;

export enum SerializationType {
  INVALID_SERIALIZATION_TYPE = 'invalid',
  SIGNED_MSG_CONCAT = 'concat',
  SIGNED_MSG_EIP712 = 'eip712',
}

export enum BytesEncodingStatus {
  INVALID_ENCODING_STATUS = 'invalid',
  BASE64_ENCODED = 'base64_encoded',
  HEX_ENCODED = 'hex_encoded',
  UINT8_ENCODED = 'uint8_encoded',
}

export enum EnvironmentType {
  BROWSER = 'browser',
  NODE = 'node',
}

export enum AuthenticationMode {
  PRIVATE = 'private',
  OPEN = 'open', // kwil-db in public mode, regardless of kgw running
}

export type PayloadBytesTypes =
  | BytesEncodingStatus.BASE64_ENCODED
  | BytesEncodingStatus.UINT8_ENCODED;

export enum BroadcastSyncType {
  ASYNC = 0,
  SYNC = 1,
  COMMIT = 2,
}

export enum AuthErrorCodes {
  PRIVATE_MODE = -1001,
  KGW_MODE = -901,
}

// For checking the unconfirmed nonce
export enum AccountStatus {
  // returns the latest confirmed nonce
  LATEST = 0,
  // returns the latest unconfirmed nonce
  PENDING = 1,
}

export enum AccountKeyType {
  // Eth
  SECP256K1 = 0,

  // i.e. Near
  ED25519 = 1,
}
