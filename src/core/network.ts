// network.ts contains interfaces for network-related data structures.

export interface Account {
    public_key: Uint8Array | string;
    balance: string;
    nonce: string;
}

export interface ChainInfo {
    chain_id: string;
    height: string;
    hash: string;
}