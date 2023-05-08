import { base64ToBytes } from "../../utils/base64";
import { Uint8ArrayToHex } from "../../utils/bytes";
import { Account } from "../interfaces/account";
import { FundingConfig } from "../interfaces/configs";
import { Database } from "../interfaces/database";
import { ITx, SelectQuery, TxReceipt } from "../interfaces/tx";
import { Api } from "./api";
import Config from "./config";
import { GenericResponse, AcctSvc, TxSvc, ConfigSvc } from "./requests";
import { unmarshal } from "../marshal";

export default class Client {
    public readonly Tx: TxClient;
    public readonly Accounts: AccountClient;
    public readonly Config: ConfigClient;
    constructor(opts: Config) {
        this.Tx = new TxClient(opts);
        this.Accounts = new AccountClient(opts);
        this.Config = new ConfigClient(opts);
    }
}

interface AnyResponse extends GenericResponse<any> {}

function checkRes(res: AnyResponse){
    if (res.status != 200 || !res.data) {
        throw new Error(JSON.stringify(res.data) || 'An unknown error has occurred.  Please check your network connection.');
    }
}

export class AccountClient {
    private api: Api;
    constructor(opts: Config) {
        this.api = new Api(opts.kwilProvider, opts);
    }

    public async getSchema(dbid: string): Promise<GenericResponse<Database<string>>> {
        const res = await this.api.get<AcctSvc.GetSchemaResponse>(`/api/v1/databases/${dbid}/schema`);
        checkRes(res);
        return {
            status: res.status,
            data: res.data.dataset
        }
    }

    public async getAccount(owner: string): Promise<GenericResponse<Account>> {
        const res = await this.api.get<AcctSvc.GetAccountResponse>(`/api/v1/accounts/${owner}`);
        checkRes(res);
        return {
            status: res.status,
            data: res.data.account
        }
    }

    public async listDatabases(owner: string): Promise<GenericResponse<string[]>> {
        const res = await this.api.get<AcctSvc.ListDatabasesResponse>(`/api/v1/${owner}/databases`);
        checkRes(res);
        return {
            status: res.status,
            data: res.data.databases
        }
    }
}

export class TxClient {
    private api: Api;
    constructor(opts: Config) {
        this.api = new Api(opts.kwilProvider, opts);
    }

    public async estimateCost(tx: ITx): Promise<GenericResponse<string>> {
        let req: TxSvc.EstimateCostReq = {
            tx: tx
        }
        const res = await this.api.post<TxSvc.EstimateCostRes>(`/api/v1/estimate_price`, req);
        checkRes(res);
        return {
            status: res.status,
            data: res.data.price
        }
    }

    public async broadcast(tx: ITx): Promise<GenericResponse<TxReceipt>> {
        let req: TxSvc.BroadcastReq = {
            tx: tx
        }
        const res = await this.api.post<TxSvc.BroadcastRes>(`/api/v1/broadcast`, req);
        checkRes(res);

        let body

        if (res.data.receipt.body) {
            const uint8 = new Uint8Array(base64ToBytes(res.data.receipt.body));
            const decoder = new TextDecoder('utf-8');
            const jsonString = decoder.decode(uint8);
            body = JSON.parse(jsonString);
        }


        const cleanReceipt: TxReceipt = !body ? {
            txHash: Uint8ArrayToHex(base64ToBytes(res.data.receipt.txHash)),
            fee: res.data.receipt.fee,
        } : {
            txHash: Uint8ArrayToHex(base64ToBytes(res.data.receipt.txHash)),
            fee: res.data.receipt.fee,
            body: body
        };
        
        return {
            status: res.status,
            data: cleanReceipt
        }
    }

    public async ping(): Promise<GenericResponse<string>> {
        const res = await this.api.get<TxSvc.PongRes>(`/api/v1/ping`);
        checkRes(res);
        return {
            status: res.status,
            data: res.data.message
        }
    }

    public async selectQuery(query: SelectQuery): Promise<GenericResponse<string>> {
        const res = await this.api.post<TxSvc.SelectRes>(`/api/v1/query`, query)
        checkRes(res);
        return {
            status: res.status,
            data: res.data.result
        }
    }
}

export class ConfigClient {
    private api: Api;
    constructor(opts: Config) {
        this.api = new Api(opts.kwilProvider, opts);
    }

    public async getFundingConfig(): Promise<GenericResponse<FundingConfig>> {
        const res = await this.api.get<ConfigSvc.FundingConfigRes>(`/api/v1/config`);
        checkRes(res);   
        return {
            status: res.status,
            data: res.data
        }
    }
}