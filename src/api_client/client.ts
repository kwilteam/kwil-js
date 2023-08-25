import { base64ToBytes } from "../utils/base64";
import { Uint8ArrayToHex } from "../utils/bytes";
import { Account } from "../core/account";
import { FundingConfig } from "../core/configs";
import {Database, SelectQuery} from "../core/database";
import {Transaction, TxBody, TxReceipt} from "../core/tx";
import { Api } from "./api";
import {Config} from "./config";
import {
    BroadcastReq,
    BroadcastRes,
    EstimateCostReq,
    EstimateCostRes, FundingConfigRes,
    GenericResponse,
    GetAccountResponse, GetSchemaResponse,
    ListDatabasesResponse, PongRes, SelectRes
} from "../core/resreq";

export default class Client extends Api {
    constructor(opts: Config) {
        super(opts.kwilProvider, opts);
    }

    public async getFundingConfig(): Promise<GenericResponse<FundingConfig>> {
        const res = await super.get<FundingConfigRes>(`/api/v1/config`);

        return checkRes(res, r => r);
    }

    public async getSchema(dbid: string): Promise<GenericResponse<Database>> {
        const res = await super.get<GetSchemaResponse>(`/api/v1/databases/${dbid}/schema`);
        return checkRes(res, r => r.dataset);
    }

    public async getAccount(owner: string): Promise<GenericResponse<Account>> {
        const res = await super.get<GetAccountResponse>(`/api/v1/accounts/${owner}`);
        return checkRes(res, r => r.account);
    }

    public async listDatabases(owner: string): Promise<GenericResponse<string[]>> {
        const res = await super.get<ListDatabasesResponse>(`/api/v1/${owner}/databases`);
        return checkRes(res, r => r.databases);
    }

    public async estimateCost(tx: Transaction<TxBody>): Promise<GenericResponse<string>> {
        let req: EstimateCostReq = {tx}
        const res = await super.post<EstimateCostRes>(`/api/v1/estimate_price`, req);
        return checkRes(res, r => r.price);
    }

    public async broadcast(tx: Transaction<TxBody>): Promise<GenericResponse<TxReceipt>> {
        if (!tx.isSigned()) {
            throw new Error('Tx must be signed before broadcasting.');
        }

        let req: BroadcastReq = {tx}
        const res = await super.post<BroadcastRes>(`/api/v1/broadcast`, req);
        checkRes(res);

        let body: any = null;

        if (res.data.receipt.body) {
            const uint8 = new Uint8Array(base64ToBytes(res.data.receipt.body));
            const decoder = new TextDecoder('utf-8');
            const jsonString = decoder.decode(uint8);
            body = JSON.parse(jsonString);
        }

        const cleanReceipt: TxReceipt = !body ? {
            txHash: Uint8ArrayToHex(base64ToBytes(res.data.receipt.txHash)),
            fee: res.data.receipt.fee,
            body: null
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
        const res = await super.get<PongRes>(`/api/v1/ping`);
        return checkRes(res, r => r.message);
    }

    public async selectQuery(query: SelectQuery): Promise<GenericResponse<string>> {
        const res = await super.post<SelectRes>(`/api/v1/query`, query)
        return checkRes(res, r => r.result);
    }
}

function checkRes<T, R>(res: GenericResponse<T>, selector?: (r: T) => R | undefined): GenericResponse<R> {
    if (res.status != 200 || !res.data) {
        throw new Error(JSON.stringify(res.data) || 'An unknown error has occurred.  Please check your network connection.');
    }

    if (!selector) {
        return {status: res.status, data: undefined};
    }

    return {
        status: res.status,
        data: selector(res.data)
    }
}