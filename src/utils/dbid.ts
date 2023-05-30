import { sha224StringToString } from "./crypto";

export function generateDBID(owner:string, name: string): string {
    return "x"+sha224StringToString(name.toLowerCase()+owner.toLowerCase())
}