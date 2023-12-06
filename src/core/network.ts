// network.ts contains interfaces for network-related data structures.

import { Base64String, HexString } from "../utils/types";
import { BytesEncodingStatus } from "./enums";

export interface Account {
    identifier: Uint8Array | string;
    balance: string;
    nonce: string;
}

export interface ChainInfo {
    chain_id: string;
    height: string;
    hash: string;
}

export type DatasetInfo = DatasetInfoBase<BytesEncodingStatus.HEX_ENCODED>;

export type DatasetInfoServer = DatasetInfoBase<BytesEncodingStatus.BASE64_ENCODED>;

export interface DatasetInfoBase<T extends BytesEncodingStatus> {
    name: string;
    owner: T extends BytesEncodingStatus.BASE64_ENCODED ? Base64String : Uint8Array;
    dbid: string;
}