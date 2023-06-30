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
import {DropDBBuilderImpl} from "../builders/drop_db_builder";
import {NonNil} from "../utils/types";
import {ActionBuilder, DBBuilder} from "../core/builders";
import {wrap} from "./intern";
import { FundingConfig } from "../core/configs";
import { Signer as Signerv5, Wallet as Walletv5 } from "ethers5"

/**
 * The main class for interacting with the Kwil network.
 */

export abstract class Kwil {
    private readonly client: Client;
    //cache schemas
    private schemas?: Map<string, GenericResponse<Database<string>>>;

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

    public async getSchema(dbid: string): Promise<GenericResponse<Database<string>>> {
        //check cache
        if (this.schemas && this.schemas.has(dbid)) {
            return this.schemas.get(dbid) as GenericResponse<Database<string>>;
        }

        //fetch from server
        const res = await this.client.getSchema(dbid);

        //cache result
        if (res.status == 200) {
            if (!this.schemas) {
                this.schemas = new Map<string, GenericResponse<Database<string>>>();
            }
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
        return DBBuilderImpl.of(this);
    }

     /**
     * Returns an instance of Drop Database Builder for this client.
     *
     * @returns A Drop Database Builder instance. Drop Database Builder is used to build drop database transactions to be broadcasted to the Kwil network.
     */

     public dropDBBuilder(): NonNil<DBBuilder> {
        return DropDBBuilderImpl.of(this);
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
     * Gets a funder object associated with a signer, which can be used for adding funds to a user's account.
     *
     * @param signer - The signer associated with the user's account. This can be a signer from Ethers v5 or Ethers v6.
     * @returns A promise that resolves to a Funder object.
     * @throws Will throw an error if it fails to get the funding config.
     */

    public async getFunder(signer: Signer | ethers.Wallet | Signerv5 | Walletv5): Promise<Funder> {
        //check cache
        if(!this.fundingConfig || !this.fundingConfig.data) {
            this.fundingConfig = await this.client.getFundingConfig();
            if (this.fundingConfig.status != 200 || !this.fundingConfig.data) {
                throw new Error('Failed to get funding config.');
            }
        }
        
        return await Funder.create(signer, this.fundingConfig.data);
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
}