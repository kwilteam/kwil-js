import { concatBytes } from "./bytes";
import { sha224BytesToString } from "./crypto";
import { isNearPubKey, nearB58ToHex } from "./keys";
import { hexToBytes, stringToBytes } from "./serial";

export function generateDBID(owner: string | Uint8Array, name: string): string {
    if(typeof owner === "string") {
        if(isNearPubKey(owner)) {
            owner = nearB58ToHex(owner);
        }

        owner = hexToBytes(owner);
    }
    
    return "x"+sha224BytesToString(concatBytes(stringToBytes(name.toLowerCase()), owner))
}