import { Signature } from "./signature";
export interface ITx {
    hash: string;
    payload_type: PayloadType;
    payload: string;
    fee: string;
    nonce: number;
    signature: Signature;
    sender: string;
}
export declare enum PayloadType {
    INVALID_PAYLOAD_TYPE = 100,
    DEPLOY_DATABASE = 101,
    MODIFY_DATABASE = 102,
    DROP_DATABASE = 103,
    EXECUTE_ACTION = 104
}
export interface SelectQuery {
    dbid: string;
    query: string;
}
export interface TxReceipt {
    txHash: string;
    fee: string;
    body?: string;
}
