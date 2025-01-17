// // you can ignore this. I am just using this to generate some quick signatures so i can test with postman

// import { Wallet } from "ethers";
// import { KwilSigner } from "../core/kwilSigner";
// import { base64ToBytes, bytesToBase64 } from "../utils/base64";
// import { sha256BytesToBytes } from "../utils/crypto";
// import { bytesToHex, stringToBytes } from "../utils/serial";
// import { ActionExecution, encodeActionExecution, encodeRawStatement, PayloadType, RawStatement } from "./broadcast_payloads";
// import { executeSign } from "../core/signature";
// import { parse, v4 } from 'uuid'

// const wallet = new Wallet('add_private_key')
// const signer = new KwilSigner(
//     wallet,
//     wallet.address
// )

// // transaction payload for jsonrpc request
// let rawStmt: RawStatement = {
//     statement: "INSERT INTO posts VALUES ($val)",
//     parameters: [{
//         name: '$val',
//         value: {
//             type: {
//                 name: 'text',
//                 is_array: false,
//                 metadata: [0, 0]
//             },
//             data: [
//                 stringToBytes('hello world')
//             ]
//         }
//     }]
// }

// async function getTxProperties(encodedPayload: string, payloadType: PayloadType, chainid: string, nonce: number) {
//     console.log('PAYLOAD: ', encodedPayload);

//     const description = ''
//     const digest = sha256BytesToBytes(base64ToBytes(encodedPayload)).subarray(0, 20)


//     const signatureMessage = `${description}

// PayloadType: ${payloadType}
// PayloadDigest: ${bytesToHex(digest)}
// Fee: 0
// Nonce: ${nonce}

// Kwil Chain ID: ${chainid}
// `

// console.log(signatureMessage)

//     const signature = await executeSign(stringToBytes(signatureMessage), signer.signer, signer.signatureType);

//     console.log('SIGNATURE IS: ', bytesToBase64(signature))
//     console.log('SENDER IS', bytesToHex(signer.identifier))
//     console.log('TYPE IS: ', signer.signatureType)
// }


// const actExec: ActionExecution = {
//     dbid: 'main',
//     action: 'insert_tester',
//     arguments: [[{
//         type: {
//             name: "text",
//             is_array: false,
//             metadata: [0,0]
//         },
//         data: [stringToBytes('hello')]
//     }]]
// }

// // getTxProperties(
// //     encodeActionExecution(actExec),
// //     PayloadType.EXECUTE,
// //     'kwil-testnet',
// //     22
// // )

// getTxProperties(
//     encodeRawStatement(rawStmt),
//     PayloadType.RAW_STATEMENT,
//     'kwil-testnet',
//     23
// )