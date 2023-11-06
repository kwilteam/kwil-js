import { Base64String } from "../utils/types";
import { BytesEncodingStatus } from "./enums";
import { Signature } from "./signature";

export interface AuthenticatedBody<T extends BytesEncodingStatus.BASE64_ENCODED | BytesEncodingStatus.UINT8_ENCODED> {
    sender: Base64String;
    signature: Signature<T>
}

export interface AuthResponse {
    nonce: string;
    statement: string;
    issue_at: string;
    expiration_time: string;
}

export function composeAuthMsg(authRes: AuthResponse, uri: string, address: string, version: string, chainId: string): string {
    let msg = '';
    msg += `${uri} wants you to sign in with your account:\n`;
    msg += `${address}\n\n`;
    if (authRes.statement) {
        msg += `${authRes.statement}\n\n`;
    }
    msg += `URI: ${uri}\n`;
    msg += `Version: ${version}\n`;
    msg += `Chain ID: ${chainId}\n`;
    msg += `Nonce: ${authRes.nonce}\n`;
    msg += `Issue At: ${authRes.issue_at}\n`;
    msg += `Expiration Time: ${authRes.expiration_time}\n`;
    return msg;
}