import { generateDBID } from "../utils/dbid";
import Client from "./client/client";
import Config from "./client/config";
import { GenericResponse } from "./client/requests";
import { Database, DbList } from "./interfaces/database";
import { ITx, SelectQuery, TxReceipt } from "./interfaces/tx";
import { Account } from "./interfaces/account";
import { Transaction } from "./transactions/transaction";
import { ethers, JsonRpcSigner } from "ethers";
import { Funder } from "./funder/funding";
import { Action } from "./action/action";
import { base64ToBytes } from "../utils/base64";
import { DBBuilder } from "./builder/builder";

export class Kwil {
    private client: Client;

    constructor(opts: Config) {
        const client = new Client({
            kwilProvider: opts.kwilProvider,
            apiKey: opts.apiKey,
            network: opts.network,
            timeout: opts.timeout,
            logging: opts.logging,
            logger: opts.logger,
        })
        this.client = client;
    }

    public getDBID(owner: string, name: string): string {
        return generateDBID(name, owner);
    }
    
    public async getSchema(dbid: string): Promise<GenericResponse<Database<string>>> {
        const res = await this.client.Accounts.getSchema(dbid);
        return res;
    }

    public async estimateCost(tx: ITx): Promise<GenericResponse<string>> {
        return await this.client.Tx.estimateCost(tx);
    }

    public async getAccount(owner: string): Promise<GenericResponse<Account>> {
        owner = owner.toLowerCase();
        return await this.client.Accounts.getAccount(owner);
    }

    public async getAction(dbid: string, actionName: string): Promise<Action> {
        const action = new Action(dbid, actionName, this.client);
        await action.init();
        return action;
    }

    public newDatabase(json: object): DBBuilder {
        return new DBBuilder(json, this.client);
    }

    public async broadcast(tx: Transaction): Promise<GenericResponse<TxReceipt>> {
        if (tx.tx.signature.signature_bytes === "" || tx.tx.sender === "") {
            throw new Error('Tx must be sgined before broadcasting.');
        }

        return await this.client.Tx.broadcast(tx.tx);
    }

    public async listDatabases(owner: string): Promise<GenericResponse<DbList>> {
        owner = owner.toLowerCase();

        return await this.client.Accounts.listDatabases(owner);
    }

    public async ping(): Promise<GenericResponse<string>> {
        return await this.client.Tx.ping();
    }

    public async getFunder(signer: JsonRpcSigner| ethers.Wallet): Promise<Funder> {
        const fundingConfig = await this.client.Config.getFundingConfig();
        if (fundingConfig.status != 200 || !fundingConfig.data) {
            throw new Error('Failed to get funding config.');
        }
        const funder = new Funder(signer, fundingConfig.data);
        await funder.init();
        return funder;
    }

    public async selectQuery(dbid: string, query: string): Promise<GenericResponse<Object[]>> {
        const q: SelectQuery = {
            dbid: dbid,
            query: query,
        }
        
        let res = await this.client.Tx.selectQuery(q);
        const uint8 = new Uint8Array(base64ToBytes(res.data as string));
        const decoder = new TextDecoder('utf-8');
        const jsonString = decoder.decode(uint8);
        return {
            status: res.status,
            data: JSON.parse(jsonString),
        } as GenericResponse<Map<string, any>[]>;
    }
}