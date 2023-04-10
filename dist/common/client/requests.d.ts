import { Database, DbList } from "../interfaces/database";
import { Account } from "../interfaces/account";
import { ITx } from "../interfaces/tx";
import { TxReceipt } from "../interfaces/tx";
export interface GenericResponse<T> {
    status: number;
    data?: T;
}
export declare namespace AcctSvc {
    interface GetSchemaResponse {
        dataset: Database<string>;
    }
    interface GetAccountResponse {
        account: Account;
    }
    interface ListDatabasesResponse {
        databases: DbList;
    }
}
export declare namespace TxSvc {
    interface EstimateCostReq {
        tx: ITx;
    }
    interface EstimateCostRes {
        price: string;
    }
    interface BroadcastReq {
        tx: ITx;
    }
    interface BroadcastRes {
        receipt: TxReceipt;
    }
    interface PongRes {
        message: string;
    }
    interface SelectRes {
        result: string;
    }
}
export declare namespace ConfigSvc {
    interface FundingConfigRes {
        chain_code: number;
        provider_address: string;
        pool_address: string;
    }
}
