import { isNearPubKey } from "../core/builders";
import { nearB58ToHex } from "./base58";
import { concatBytes } from "./bytes";
import { sha224BytesToString } from "./crypto";
import { hexToBytes, stringToBytes } from "./serial";

export function generateDBID(pubKey:string, name: string): string {
    if(isNearPubKey(pubKey)) {
        pubKey = nearB58ToHex(pubKey);
    }

    return "x"+sha224BytesToString(concatBytes(stringToBytes(name.toLowerCase()), hexToBytes(pubKey)))
}