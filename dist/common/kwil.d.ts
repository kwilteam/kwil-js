import Config from "./client/config";
import { GenericResponse } from "./client/requests";
import { Database, DbList } from "./interfaces/database";
import { ITx, TxReceipt } from "./interfaces/tx";
import { Account } from "./interfaces/account";
import { Transaction } from "./transactions/transaction";
import { ethers } from "ethers";
import { Funder } from "./funder/funding";
import { Action } from "./action/action";
import { DBBuilder } from "./builder/builder";
export declare class Kwil {
    private client;
    constructor(opts: Config);
    getSchema(owner: string, name: string): Promise<GenericResponse<Database<string>>>;
    estimateCost(tx: ITx): Promise<GenericResponse<string>>;
    getAccount(owner: string): Promise<GenericResponse<Account>>;
    getAction(dbid: string, actionName: string): Promise<Action>;
    newDatabase(json: object): DBBuilder;
    broadcast(tx: Transaction): Promise<GenericResponse<TxReceipt>>;
    listDatabases(owner: string): Promise<GenericResponse<DbList>>;
    ping(): Promise<GenericResponse<string>>;
    getFunder(signer: ethers.providers.JsonRpcSigner | ethers.Wallet): Promise<Funder>;
    selectQuery(dbid: string, query: string): Promise<GenericResponse<any>>;
}
