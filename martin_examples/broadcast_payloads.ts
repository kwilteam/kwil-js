import { bytesToBase64 } from "../src/utils/base64"
import { concatBytes, numberToUint16BigEndian } from "../src/utils/bytes"
import { booleanToBytes, hexToBytes, stringToBytes } from "../src/utils/serial"
import { numberToUint16LittleEndian, numberToUint32BigEndian, prefixBytesLength } from "./utils"

// ~~TRANSACTION INTERFACE~~ - to be used on all `user.broadcast` requests

// This is what needs to go on the `params` field on the JSON-RPC request
interface Transaction {
    tx: {
        signature: {
            // Sig is the base64 string of the signature (returned from the `executeSign` function)
            sig: string
            // Type is should be the string on `kwilSigner.signatureType`.
            type: string
        },
        body: {
            // desc is the human-readable description that the developer can customize to appear in their application (e.g., allows the user to see in their metamask: "Sign here to create your account with our app!")
            desc: string
            // payload is the base64 encoded payload (SEE PAYLOAD ENCODINGS FOR MORE INFO)
            payload: string
            // type is the name of the payload type
            type: PayloadType,
            // fee is the cost of the transaction. You can get this from the `user.estimate_price` rpc method to kwild.
            // fee is string because the integer size is often larger than JavaScript's safe limit
            fee: string,
            // nonce is the user's account nonce.
            // The SDK user can optionally set a nonce manually.
            // If the SDK user does not provide a nonce, you can retrieve the account's latest nonce with the `user.account` rpc method to kwild.
            // Increment the retrieved nonce value from kwild by 1.
            nonce: number,
            // chain_id is the chainId configured in the NodeKwil/WebKwil constructor
            chain_id: string
        },
        // Serialization is the serialization type this is used on the transaction
        // Users (SDKs, CLIs, etc. only need to be concerned with `concat`)
        serialization: 'concat',
        // Sender should be the hexidecimal string on the `kwilSigner.identifier` object (you can convert the Uint8array with the `bytesToHex` function).
        sender: string
    },
    sync: TxSync
}

enum TxSync {
    // BroadcastSyncSync ensures the transaction is accepted to mempool before
    // responding. This is the default behavior.
    BroadcastSyncSync = 0,
    // BroadcastSyncCommit will wait for the transaction to be included in a
    // block.
    BroadcastSyncCommit = 1
}

enum PayloadType {
    RAW_STATEMENT = "raw_statement",
    EXECUTE = "execute",
    TRANSFER = "transfer"
}

// PAYLOAD ENCODINGS
// The information below will explain how to create the base64 string for `tx.body.payload`.

// EXECUTE RAW SQL STATEMENT (kwil.executeSQL api)

// RawStatement is the interface that needs to be encoded:
interface RawStatement {
    // statement is the SQL query string (e.g,. `INSERT INTO table VALUES $value`)
    statement: string,
    // parameters are the arguments that are passed to the query (similar to what was implemented in the `selectQuery` api).
    parameters: NamedValue[]
}

interface NamedValue {
    // name is the name of the parameter
    // E.g,. for a query `INSERT INTO table VALUES $value`, the name would be $name
    name: string,
    // value is same shape as `params.params[$variable_name]` from the selectQuery EXCEPT, rather than converting values to base64, you only need to conver them to Uint8array.
    value: EncodedValue
}

interface EncodedValue {
    type: DataType,
    // data is the bytes representation of the parameter
    // it is an array if the user passes an array of values (e.g., the column type is `text[]`, and the user passes `["hello", "world"]`)
    data: Uint8Array[]
}

interface DataType {
    // name is the name of the types. These are the same as `SelectQuery`.
    name: string
    // is_array is true if the data type is an array
    is_array: boolean
    // metadata is the length and precision of the decimal. This is only required if `name` is `decimal`.
    // if you are not using decimal, it should be [0,0]
    metadata: [number, number]
}


function encodeRawStatement(stmt: RawStatement): string {
    // to encode RawStatement, we need to concat a bytes array of all the required properties.
    // the order of each property on the interfaces is important. If the bytes are concated in an incorrect order, the database engine will not know how to decode them.

    // ~ITEMS TO ENCODE~

    // Item 1. rsVersion
    // rsVersion is a versioning number for the RawStatement interface.
    // This is used in case we different interfaces in the future and want to maintain backwards compatibility.
    const rsVersion = 0

    // rsVersion should be converted to Uint16 and concactenated with the rest of our bytes
    const CONCACTME_version = numberToUint16LittleEndian(rsVersion);

    // Item 2. Rawstatement.statement
    // We first need to convert the string to bytes
    const stmtBytes = stringToBytes(stmt.statement);

    // then, we need to prefix the byte array with its length. The length must be represented by 4 bytes (uint32)

    const CONCACTME_statement = prefixBytesLength(stmtBytes)

    // Item 3. Rawstatement.parameters
    let CONCACTME_param: Uint8Array

    // We first need to append the number of parameters with two bytes (uint16)
    CONCACTME_param = numberToUint16LittleEndian(stmt.parameters.length);

    // then, for each parameter..
    for (const param of stmt.parameters) {
        // convert the string to bytes
        const nameBytes = stringToBytes(param.name);

        // prefix bytes array with length
        const prefixedNameBytes = prefixBytesLength(nameBytes)

        // encode each value with the `encodeEncodedValue` function
        const valueBytes = encodeEncodedValue(param.value);

        // prefix value with its length
        const valueBytesPrefix = prefixBytesLength(valueBytes)

        // concatenate with our paramBytes
        CONCACTME_param = concatBytes(CONCACTME_param, prefixedNameBytes, valueBytesPrefix)
    }

    // concat all bytes IN ORDER they appear on the interface
    const bytes = concatBytes(
        CONCACTME_version,
        CONCACTME_statement,
        CONCACTME_param
    )

    // send to base64 on return
    return bytesToBase64(bytes);
}

function encodeEncodedValue(ev: EncodedValue): Uint8Array {
    // to encode an `EncodedValue` we need to concat a bytes array with all of the necessary elements
    // similar to earlier encoding functions, the order is important.

    // ~ITEMS TO ENCODE~

    // Item 1. evVersion
    // The versioning number for `EncodedValue`
    const evVersion = 0

    // convert evVersion to Uint16
    const CONCACTME_version = numberToUint16LittleEndian(evVersion);

    // Item 2. EncodedValue.type
    // use the `encodeDataType` function to get the bytes
    const dataTypeBytes = encodeDataType(ev.type);

    const CONCACTME_type = prefixBytesLength(dataTypeBytes);

    // Item 3. EncodedValue.data

    // first, prepend 4 bytes (uint32) for the length of bytes
    const dataLength = numberToUint16LittleEndian(ev.data.length);

    let CONCACTME_data = concatBytes(dataLength)
    // then, for each element in the data array
    for (const data of ev.data) {
        CONCACTME_data = concatBytes(
            CONCACTME_data,
            prefixBytesLength(data)
        )
    }

    // Concact bytes together
    // THE ORDER WE CONCACT IS IMPORTANT
    return concatBytes(
        CONCACTME_version,
        CONCACTME_type,
        CONCACTME_data
    );
}

function encodeDataType(dt: DataType): Uint8Array {
    // I will use less comments here, since the general encoding flow follows the same as previous
    const dtVersion = 0

    // note that this one uses big endian - I don't think there is a reason, just a kwil-db inconsistency
    const versionBytes = numberToUint16BigEndian(dtVersion)

    const nameBytes = stringToBytes(dt.name)
    const nameLength = numberToUint32BigEndian(nameBytes.length)
    const isArray = booleanToBytes(dt.is_array);
    const metadataLength = numberToUint16BigEndian(dt.metadata[0])
    const precisionLength = numberToUint16BigEndian(dt.metadata[1])

    return concatBytes(
        versionBytes,
        nameLength,
        nameBytes,
        isArray,
        metadataLength,
        precisionLength
    )
}

// EXECUTE ACTION (kwil.execute API)

interface ActionExecution {
    // dbid is the namespace of the database
    dbid: string,
    // action is the name of the action to be executed
    action: string,
    // arguments is the arguments to the action
    // it is a double nested array because actions can be executed in bulk
    // E.g., for the same action `insert_hello`, you could pass [EncodedValue[], EncodedValue[]] and execute the action twice, thereby inserting two records
    arguments: EncodedValue[][]
}


function encodeActionExecution(act: ActionExecution): string {
    // ~ITEMS TO ENCODE~
    const aeVersion = 0;

    const CONCACTME_version = numberToUint16LittleEndian(aeVersion);
    const CONCACTME_dbid = prefixBytesLength(stringToBytes(act.dbid));
    const CONCATME_action = prefixBytesLength(stringToBytes(act.action));
    
    const numCalls = numberToUint16LittleEndian(act.arguments.length);
    let params: Uint8Array = new Uint8Array();
    
    act.arguments.forEach((evArr) => {
        const argLength = numberToUint16LittleEndian(evArr.length);
        let argBytes: Uint8Array = new Uint8Array()
        evArr.forEach((ev) => {
            const evBytes = encodeEncodedValue(ev)
            const prefixedEvBytes = prefixBytesLength(evBytes)

            argBytes = concatBytes(argBytes, prefixedEvBytes)
        })

        params = concatBytes(params, argLength, argBytes)
    })
    
    const CONCATME_params = concatBytes(numCalls, params);
    return bytesToBase64(
        concatBytes(
            CONCACTME_version,
            CONCACTME_dbid,
            CONCATME_action,
            CONCATME_params
        )
    )
}

interface Transfer {
    to: AccountId,
    amount: BigInt
}

interface AccountId {
    // hexidecimal string of the recipient's identifier (e.g., Ethereum address, ed25519 string, etc.)
    identifier: string
    // key type of the recipient identifier.
    // default to kwil are secp256k1 and ed25519. Users can add custom keys with an authenticator extension.
    // @martin-opensky - I think we will have to create an option for the user to pass a key type if their network users an authenticator extension?
    key_type: string
}

function encodeTransfer(t: Transfer): string {
    const tVersion = 0;

    const CONCACTME_version = numberToUint16LittleEndian(tVersion);
    const CONCACTME_to = prefixBytesLength(encodeAccountId(t.to))
    // for BigInt Serialization, add a single byte and then encode it as a string
    const CONCATME_amt = concatBytes(
        new Uint8Array([1]),
        prefixBytesLength(stringToBytes(t.amount.toString()))
    )

    return bytesToBase64(
        concatBytes(
            CONCACTME_version,
            CONCACTME_to,
            CONCATME_amt
        )
    )
}

function encodeAccountId(a: AccountId): Uint8Array {
    const CONCATEME_id = prefixBytesLength(hexToBytes(a.identifier))
    const CONCATEME_type = prefixBytesLength(stringToBytes(a.key_type))
    return concatBytes(
        CONCATEME_id,
        CONCATEME_type
    )
}

  export {
    RawStatement,
    encodeRawStatement,
    PayloadType,
    ActionExecution,
    encodeActionExecution,
    EncodedValue,
    encodeEncodedValue,
    Transfer,
    encodeTransfer
  }