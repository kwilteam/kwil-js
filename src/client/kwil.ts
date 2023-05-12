import {generateDBID} from "../utils/dbid";
import Client from "../api_client/client";
import { Config } from "../api_client/config";
import {GenericResponse} from "../core/resreq";
import {Database, SelectQuery} from "../core/database";
import {Transaction, TxReceipt} from "../core/tx";
import {Account} from "../core/account";
import {ethers, Signer} from "ethers";
import {Funder} from "../funder/funding";
import {ActionBuilderImpl} from "../builders/action_builder";
import {base64ToBytes} from "../utils/base64";
import {DBBuilderImpl} from "../builders/db_builder";
import {NonNil} from "../utils/types";
import {ActionBuilder, DBBuilder} from "../core/builders";
import {wrap} from "./intern";
import { FundingConfig } from "../core/configs";
import { Cache } from "../utils/cache";

export abstract class Kwil {
    private readonly client: Client;
    //cache schemas
    private schemas: Cache<GenericResponse<Database<string>>>;

    // cache fundingConfig
    private fundingConfig?: GenericResponse<FundingConfig>;

    protected constructor(opts: Config) {
        this.client = new Client({
            kwilProvider: opts.kwilProvider,
            apiKey: opts.apiKey,
            network: opts.network,
            timeout: opts.timeout,
            logging: opts.logging,
            logger: opts.logger,
        });

        this.schemas = Cache.passive();
        wrap(this, this.client.estimateCost.bind(this.client));
    }

    public getDBID(owner: string, name: string): string {
        return generateDBID(name, owner);
    }

    public async getSchema(dbid: string): Promise<GenericResponse<Database<string>>> {
        //check cache
        const schema = this.schemas.get(dbid)
        if (schema) {
            return schema;
        }

        //fetch from server
        const res = await this.client.getSchema(dbid);

        //cache result
        if (res.status == 200) {
            this.schemas.set(dbid, res);
        }

        return res;
    }

    public async getAccount(owner: string): Promise<GenericResponse<Account>> {
        owner = owner.toLowerCase();
        return await this.client.getAccount(owner);
    }

    public actionBuilder(): NonNil<ActionBuilder> {
        return ActionBuilderImpl.of(this);
    }

    public dbBuilder(): NonNil<DBBuilder> {
        return DBBuilderImpl.of(this);
    }

    public async broadcast(tx: Transaction): Promise<GenericResponse<TxReceipt>> {
        return await this.client.broadcast(tx);
    }

    public async listDatabases(owner: string): Promise<GenericResponse<string[]>> {
        owner = owner.toLowerCase();

        return await this.client.listDatabases(owner);
    }

    public async ping(): Promise<GenericResponse<string>> {
        return await this.client.ping();
    }

    public async getFunder(signer: Signer| ethers.Wallet): Promise<Funder> {
        //check cache
        if(!this.fundingConfig || !this.fundingConfig.data) {
            this.fundingConfig = await this.client.getFundingConfig();
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

        let res = await this.client.selectQuery(q);
        const uint8 = new Uint8Array(base64ToBytes(res.data as string));
        const decoder = new TextDecoder('utf-8');
        const jsonString = decoder.decode(uint8);
        return {
            status: res.status,
            data: JSON.parse(jsonString),
        } as GenericResponse<Map<string, any>[]>;
    }
}