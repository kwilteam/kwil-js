// you can ignore this. I am just using this to generate some quick signatures so i can test with postman

import { Wallet } from "ethers";
import { KwilSigner } from "../src/core/kwilSigner";
import { base64ToBytes, bytesToBase64 } from "../src/utils/base64";
import { sha256BytesToBytes } from "../src/utils/crypto";
import { bytesToHex, stringToBytes } from "../src/utils/serial";
import { ActionExecution, encodeTransfer, PayloadType, RawStatement, Transfer } from "./broadcast_payloads";
import { executeSign } from "../src/core/signature";
import { ActionCall } from "./call_payload";
import { encodeScalar } from "./encode_scalar";

const wallet = new Wallet('0000000000000000000000000000000000000000000000000000000000000001')

const signer = new KwilSigner(
    wallet,
    wallet.address
)

// transaction payload for jsonrpc request
let rawStmt: RawStatement = {
    statement: "INSERT INTO posts VALUES ($val)",
    parameters: [{
        name: '$val',
        value: {
            type: {
                name: 'text',
                is_array: false,
                metadata: [0, 0]
            },
            data: [
                encodeScalar('hello world')
            ]
        }
    }]
}

async function getTxProperties(encodedPayload: string, payloadType: PayloadType, chainid: string, nonce: number) {
    console.log('PAYLOAD: ', encodedPayload);

    const description = ''
    const digest = sha256BytesToBytes(base64ToBytes(encodedPayload)).subarray(0, 20)


    const signatureMessage = `${description}

PayloadType: ${payloadType}
PayloadDigest: ${bytesToHex(digest)}
Fee: 0
Nonce: ${nonce}

Kwil Chain ID: ${chainid}
`

console.log(signatureMessage)

    const signature = await executeSign(stringToBytes(signatureMessage), signer.signer, signer.signatureType);

    console.log('SIGNATURE IS: ', bytesToBase64(signature))
    console.log('SENDER IS', bytesToHex(signer.identifier))
    console.log('TYPE IS: ', signer.signatureType)
}


const actExec: ActionExecution = {
    dbid: 'main',
    action: 'insert_tester',
    arguments: [[{
        type: {
            name: "text",
            is_array: false,
            metadata: [0,0]
        },
        data: [encodeScalar('hello world')]
    }]]
}

// getTxProperties(
//     encodeActionExecution(actExec),
//     PayloadType.EXECUTE,
//     'kwil-testnet',
//     2
// )

// getTxProperties(
//     encodeRawStatement(rawStmt),
//     PayloadType.RAW_STATEMENT,
//     'kwil-testnet',
//     23
// )

const aCall: ActionCall = {
    dbid: 'main',
    action: 'return_param',
    arguments: [{
        type: {
            name: 'text',
            is_array: false,
            metadata: [0,0]
        },
        data: [encodeScalar('hello world')]
    }]
}

// console.log(encodeActionCall(aCall))

const transfer: Transfer = {
    to: {
        identifier: 'affdc06cf34afd7d5801a13d48c92ad39609901d',
        key_type: 'secp256k1'
    },
    amount: BigInt(100)
}

getTxProperties(
    encodeTransfer(transfer),
    PayloadType.TRANSFER,
    'kwil-testnet',
    1
)