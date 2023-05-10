import {Database} from "./database";
import {Account} from "./account";
import {Transaction, TxReceipt} from "./tx";

export interface GenericResponse<T> {
    status: number;
    data?: T;
}

export interface GetSchemaResponse {
    dataset: Database<string>;
}

export interface GetAccountResponse {
    account: Account;
}

export interface ListDatabasesResponse {
    databases: string[];
}

export interface EstimateCostReq {
    tx: Transaction;
}

export interface EstimateCostRes {
    price: string;
}

export interface BroadcastReq {
    tx: Transaction;
}

export interface BroadcastRes {
    receipt: TxReceipt;
}

export interface PongRes {
    message: string;
}

export interface SelectRes {
    result: string
}
export interface FundingConfigRes {
    chain_code: number;
    provider_address: string;
    pool_address: string;
}
