import Config from "./client/config";
import { GenericResponse } from "./client/requests";
import { Database } from "./interfaces/database";
import { ITx, TxReceipt } from "./interfaces/tx";
import { Account } from "./interfaces/account";
import { Transaction } from "./transactions/transaction";
import { ethers, Signer } from "ethers";
import { Funder } from "./funder/funding";
import { Action } from "./action/action";
import { DBBuilder } from "./builder/builder";
export declare class Kwil {
    private client;
    private schemas?;
    private fundingConfig?;
    constructor(opts: Config);
    getDBID(owner: string, name: string): string;
    getSchema(dbid: string): Promise<GenericResponse<Database<string>>>;
    estimateCost(tx: ITx): Promise<GenericResponse<string>>;
    getAccount(owner: string): Promise<GenericResponse<Account>>;
    getAction(dbid: string, actionName: string): Promise<Action>;
    newDatabase(json: object): DBBuilder;
    broadcast(tx: Transaction): Promise<GenericResponse<TxReceipt>>;
    listDatabases(owner: string): Promise<GenericResponse<string[]>>;
    ping(): Promise<GenericResponse<string>>;
    getFunder(signer: Signer | ethers.Wallet): Promise<Funder>;
    selectQuery(dbid: string, query: string): Promise<GenericResponse<Object[]>>;
}
