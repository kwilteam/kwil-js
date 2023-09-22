export interface Account {
    public_key: Uint8Array | string;
    balance: string;
    nonce: string;
}