import { isNearPubKey } from "../core/builders";
import { nearB58ToHex } from "./base58";
import { concatBytes } from "./bytes";
import { sha224BytesToString } from "./crypto";
import { hexToBytes, stringToBytes } from "./serial";

export function generateDBID(pubKey: string | Uint8Array, name: string): string {
    if(typeof pubKey === "string") {
        if(isNearPubKey(pubKey)) {
            pubKey = nearB58ToHex(pubKey);
        }

        pubKey = hexToBytes(pubKey);
    }
    
    return "x"+sha224BytesToString(concatBytes(stringToBytes(name.toLowerCase()), pubKey))
}