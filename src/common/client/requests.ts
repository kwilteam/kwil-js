import { Database, DbList } from "../interfaces/database";
import { Account } from "../interfaces/account";
import { ITx } from "../interfaces/tx";
import { TxReceipt } from "../interfaces/tx";

export interface GenericResponse<T> {
    status: number;
    data?: T;
}

export namespace AcctSvc {
    export interface GetSchemaResponse {
        dataset: Database<string>;
    }

    export interface GetAccountResponse {
        account: Account;
    }

    export interface ListDatabasesResponse {
        databases: DbList;
    }
}

export namespace TxSvc {
    export interface EstimateCostReq {
        tx: ITx;
    }

    export interface EstimateCostRes {
        price: string;
    }

    export interface BroadcastReq {
        tx: ITx;
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
}

export namespace ConfigSvc {
    export interface FundingConfigRes {
        chain_code: number;
        provider_address: string;
        pool_address: string;
    }
}