export interface Signature {
    signature_bytes: string;
    signature_type: SignatureType;
}

export enum SignatureType {
    SIGNATURE_TYPE_INVALID = 0,
    PK_SECP256K1_UNCOMPRESSED,
	ACCOUNT_SECP256K1_UNCOMPRESSED
}