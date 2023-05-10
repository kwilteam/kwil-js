import { generateDBID } from "../utils/dbid";
import Client from "./client/client";
import Config from "./client/config";
import { GenericResponse } from "./client/requests";
import { Database } from "./interfaces/database";
import { ITx, SelectQuery, TxReceipt } from "./interfaces/tx";
import { Account } from "./interfaces/account";
import { Transaction } from "./transactions/transaction";
import { ethers, Signer } from "ethers";
import { Funder } from "./funder/funding";
import { Action } from "./action/action";
import { base64ToBytes } from "../utils/base64";
import { DBBuilder } from "./builder/builder";
import { FundingConfig } from "./interfaces/configs";

export class Kwil {
    private client: Client;

    //cache schemas
    private schemas?: Map<string, GenericResponse<Database<string>>>;

    //cache fundingConfig
    private fundingConfig?: GenericResponse<FundingConfig>;

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
        //check cache
        if (this.schemas && this.schemas.has(dbid)) {
            return this.schemas.get(dbid) as GenericResponse<Database<string>>;
        }
        
        //fetch from server
        const res = await this.client.Accounts.getSchema(dbid);

        //cache result
        if (res.status == 200) {
            if (!this.schemas) {
                this.schemas = new Map<string, GenericResponse<Database<string>>>();
            }
            this.schemas.set(dbid, res);
        }

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
        let schema: GenericResponse<Database<string>>

        //check cache
        if (this.schemas && this.schemas.has(dbid)) {
            schema = this.schemas.get(dbid) as GenericResponse<Database<string>>;
        } else {
            schema = await this.getSchema(dbid);
        }

        return await Action.retrieve(dbid, actionName, this.client, schema);
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

    public async listDatabases(owner: string): Promise<GenericResponse<string[]>> {
        owner = owner.toLowerCase();

        return await this.client.Accounts.listDatabases(owner);
    }

    public async ping(): Promise<GenericResponse<string>> {
        return await this.client.Tx.ping();
    }

    public async getFunder(signer: Signer| ethers.Wallet): Promise<Funder> {
        //check cache
        if(!this.fundingConfig || !this.fundingConfig.data) {
            this.fundingConfig = await this.client.Config.getFundingConfig();
            if (this.fundingConfig.status != 200 || !this.fundingConfig.data) {
                throw new Error('Failed to get funding config.');
            }
        }
        
        return await Funder.create(signer, this.fundingConfig.data);
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