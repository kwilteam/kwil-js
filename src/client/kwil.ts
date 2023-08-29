import { generateDBID } from "../utils/dbid";
import Client from "../api_client/client";
import { Config } from "../api_client/config";
import {GenericResponse} from "../core/resreq";
import {Database, SelectQuery} from "../core/database";
import {Transaction, TxReceipt} from "../core/tx";
import {Account} from "../core/account";
import {ActionBuilderImpl} from "../builders/action_builder";
import {base64ToBytes} from "../utils/base64";
import {DBBuilderImpl} from "../builders/db_builder";
import {NonNil} from "../utils/types";
import {ActionBuilder, DBBuilder} from "../core/builders";
import {wrap} from "./intern";
import { Cache } from "../utils/cache";
import { TxInfoReceipt } from "../core/txQuery";
import { Message, MsgReceipt } from "../core/message";
import { PayloadType } from "../core/enums";

/**
 * The main class for interacting with the Kwil network.
 */

export abstract class Kwil {
    private readonly client: Client;
    //cache schemas
    private schemas: Cache<GenericResponse<Database>>;

    protected constructor(opts: Config) {
        this.client = new Client({
            kwilProvider: opts.kwilProvider,
            apiKey: opts.apiKey,
            network: opts.network,
            timeout: opts.timeout,
            logging: opts.logging,
            logger: opts.logger,
            cache: opts.cache,
        });

        this.schemas = Cache.passive(opts.cache);
        wrap(this, this.client.estimateCost.bind(this.client));
    }

    /**
     * Generates a unique database identifier (DBID) from the provided owner's Ethereum wallet address and a database name.
     *
     * @param owner - The owner's Ethereum wallet address. This should be a valid Ethereum address.
     * @param name - The name of the database. This should be a unique name to identify the database.
     * @returns A string that represents the unique identifier for the database.
     */

    public getDBID(owner: string, name: string): string {
        return generateDBID(owner, name);
    }

    /**
     * Retrieves the schema of a database given its unique identifier (DBID).
     *
     * @param dbid - The unique identifier of the database. The DBID can be generated using the kwil.getDBID method.
     * @returns A promise that resolves to the schema of the database. 
     */

    public async getSchema(dbid: string): Promise<GenericResponse<Database>> {
        // check cache
        const schema = this.schemas.get(dbid)
        if (schema) {
            return schema;
        }

        //fetch from server
        const res = await this.client.getSchema(dbid);

        //cache result
        if (res.status === 200) {
            this.schemas.set(dbid, res);
        }

        return res;
    }

    /**
     * Retrieves an account using the owner's Ethereum wallet address.
     *
     * @param owner - The owner's Ethereum wallet address. This should be a valid Ethereum address.
     * @returns A promise that resolves to an Account object. The account object includes the owner's address, balance, and nonce.
     */

    public async getAccount(owner: string): Promise<GenericResponse<Account>> {
        owner = owner.toLowerCase();
        return await this.client.getAccount(owner);
    }

    /**
     * Returns an instance of ActionBuilder for this client.
     *
     * @returns An ActionBuilder instance. ActionBuilder is used to build action transactions to be broadcasted to the Kwil network.
     */  

    public actionBuilder(): NonNil<ActionBuilder> {
        return ActionBuilderImpl.of(this);
    }

    /**
     * Returns an instance of DBBuilder for this client.
     *
     * @returns A DBBuilder instance. DBBuilder is used to build new database transactions to be broadcasted to the Kwil network.
     */

    public dbBuilder(): NonNil<DBBuilder> {
        return DBBuilderImpl.of(this, PayloadType.DEPLOY_DATABASE);
    }

    /**
    * Returns an instance of Drop Database Builder for this client.
    *
    * @returns A Drop Database Builder instance. Drop Database Builder is used to build drop database transactions to be broadcasted to the Kwil network.
    */

     public dropDbBuilder(): NonNil<DBBuilder> {
        return DBBuilderImpl.of(this, PayloadType.DROP_DATABASE);
     }

    /**
     * Broadcasts a transaction on the network.
     *
     * @param tx - The transaction to broadcast. The transaction can be built using the ActionBuilder or DBBuilder.
     * @returns A promise that resolves to the receipt of the transaction. The transaction receipt includes the transaction hash, fee, and body.
     */

    public async broadcast(tx: Transaction): Promise<GenericResponse<TxReceipt>> {
        return await this.client.broadcast(tx);
    }

    /**
     * Sends a message to a Kwil node. This can be used to execute read-only actions on Kwil.
     * 
     * @param msg - The message to send. The message can be built using the ActionBuilder class.
     * @returns A promise that resolves to the receipt of the message.
     */

    public async call(msg: Message): Promise<GenericResponse<MsgReceipt>> {
        return await this.client.call(msg);
    }

    /**
     * Lists all databases owned by a particular owner.
     *
     * @param owner - The owner's Ethereum wallet address. This should be a valid Ethereum address.
     * @returns A promise that resolves to a list of database names.
     */

    public async listDatabases(owner: string): Promise<GenericResponse<string[]>> {
        owner = owner.toLowerCase();

        return await this.client.listDatabases(owner);
    }

    /**
     * Pings the server and gets a response.
     *
     * @returns A promise that resolves to a string indicating the server's response.
     */

    public async ping(): Promise<GenericResponse<string>> {
        return await this.client.ping();
    }

    /**
     * Performs a SELECT query on a database. The query must be a read-only query.
     *
     * @param dbid - The unique identifier of the database. The DBID can be generated using the kwil.getDBID method.
     * @param query - The SELECT query to execute.
     * @returns A promise that resolves to a list of objects resulting from the query.
     */

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

    /** 
     * Retrieves information about a transaction given its hash.
     * 
     * @param hash - The hash of the transaction.
     * @returns A promise that resolves to the transaction info receipt.
    */
    public async txInfo(hash: string): Promise<GenericResponse<TxInfoReceipt>> {
        return await this.client.txInfo(hash);
    }
}