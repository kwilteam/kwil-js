export interface Signature {
    signature_bytes: string;
    signature_type: SignatureType;
}

export enum SignatureType {
    SIGNATURE_TYPE_INVALID = 'invalid',
	SECP256K1_PERSONAL = 'secp256k1_ep'
}