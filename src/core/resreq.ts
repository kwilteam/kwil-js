import {Database} from "./database";
import {Account} from "./account";
import {Transaction, TxnData } from "./tx";
import { TxResult } from "./txQuery";

export interface GenericResponse<T> {
    status: number;
    data?: T;
}

export interface GetSchemaResponse {
    schema: Database;
}

export interface GetAccountResponse {
    account: Account;
}

export interface ListDatabasesResponse {
    databases: string[];
}

export interface EstimateCostReq {
    tx: TxnData;
}

export interface EstimateCostRes {
    price: string;
}

export interface BroadcastReq {
    tx: TxnData;
}

export interface BroadcastRes {
    tx_hash: string;
}

export interface CallRes {
    result: string;
}

export interface PongRes {
    message: string;
}

export interface SelectRes {
    result: string
}

export interface TxQueryReq {
    tx_hash: string;
}

export interface TxQueryRes {
    hash: string;
    height: number;
    tx: Transaction;
    tx_result: TxResult;
}