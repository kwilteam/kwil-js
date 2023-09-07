import { HexString } from "../utils/types";
import { PayloadType } from "./enums";

export interface Signature {
    signature_bytes: string | Uint8Array;
    signature_type: SignatureType;
}

export enum SignatureType {
    SIGNATURE_TYPE_INVALID = 'invalid',
	SECP256K1_PERSONAL = 'secp256k1_ep',
    ED25519_NEAR = 'ed25519_nr',
}