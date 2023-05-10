import { sha224StringToString } from "./crypto";

export function generateDBID(name: string, owner:string): string {
    return "x"+sha224StringToString(name.toLowerCase()+owner.toLowerCase())
}