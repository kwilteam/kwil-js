import { bytesToBase64 } from "../src/utils/base64";
import { concatBytes } from "../src/utils/bytes";
import { stringToBytes } from "../src/utils/serial";
import { EncodedValue, encodeEncodedValue } from "./broadcast_payloads";
import { numberToUint16LittleEndian, prefixBytesLength } from "./utils";

// the JSON-RPC body for action call is:

interface CallMessageBody {
    body: {
        // base64 encoded payload (created with the `encodeActionCall` function)
        payload: string,
        // base64 string of the challenge. Only required if the user is authenticating with a private mode kwild
        challenge: string
    },
    // Type is the string on `kwilSigner.signatureType`. This is needed for if the caller is authenticated with KGW.
    auth_type: string,
    // Sender should be the hexidecimal string on the `kwilSigner.identifier` object (you can convert the Uint8array with the `bytesToHex` function).
    // Only needed if the user provides a `KwilSigner` (which would mean kwild is running in private mode)
    sender: string,
    signature: {
        // base64 string of the signature
        sig: string,
        // Type is should be the string on `kwilSigner.signatureType`. Yes, this is redundant with the `auth_type` above.
        type: string
    }
}

export interface ActionCall {
    dbid: string,
    action: string,
    arguments: EncodedValue[]
}

export function encodeActionCall(ac: ActionCall): string {
    const acVersion = 0;
    const CONCACTME_version = numberToUint16LittleEndian(acVersion);
    const CONCATME_DBID = prefixBytesLength(stringToBytes(ac.dbid));
    const CONCATME_action = prefixBytesLength(stringToBytes(ac.action));
    const numArgs = numberToUint16LittleEndian(ac.arguments.length);
    let params: Uint8Array = new Uint8Array();

    ac.arguments.forEach((a) => {
        const aBytes = encodeEncodedValue(a)
        const prefixedABytes = prefixBytesLength(aBytes);

        params = concatBytes(params, prefixedABytes)
    })

    const CONCACTME_params = concatBytes(numArgs, params);

    return bytesToBase64(
        concatBytes(
            CONCACTME_version,
            CONCATME_DBID,
            CONCATME_action,
            CONCACTME_params
        )
    )
}