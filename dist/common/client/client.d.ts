import { Account } from "../interfaces/account";
import { FundingConfig } from "../interfaces/configs";
import { Database, DbList } from "../interfaces/database";
import { ITx, SelectQuery, TxReceipt } from "../interfaces/tx";
import Config from "./config";
import { GenericResponse } from "./requests";
export default class Client {
    readonly Tx: TxClient;
    readonly Accounts: AccountClient;
    readonly Config: ConfigClient;
    constructor(opts: Config);
}
export declare class AccountClient {
    private api;
    constructor(opts: Config);
    getSchema(dbid: string): Promise<GenericResponse<Database<string>>>;
    getAccount(owner: string): Promise<GenericResponse<Account>>;
    listDatabases(owner: string): Promise<GenericResponse<DbList>>;
}
export declare class TxClient {
    private api;
    constructor(opts: Config);
    estimateCost(tx: ITx): Promise<GenericResponse<string>>;
    broadcast(tx: ITx): Promise<GenericResponse<TxReceipt>>;
    ping(): Promise<GenericResponse<string>>;
    selectQuery(query: SelectQuery): Promise<GenericResponse<string>>;
}
export declare class ConfigClient {
    private api;
    constructor(opts: Config);
    getFundingConfig(): Promise<GenericResponse<FundingConfig>>;
}
