import { base64ToBytes, bytesToBase64 } from "../utils/base64";
import { Uint8ArrayToHex } from "../utils/bytes";
import { Account } from "../core/account";
import { FundingConfig } from "../core/configs";
import {Database, SelectQuery} from "../core/database";
import {Transaction, TxReceipt} from "../core/tx";
import { Api } from "./api";
import {Config} from "./config";
import {
    BroadcastReq,
    BroadcastRes,
    EstimateCostReq,
    EstimateCostRes, FundingConfigRes,
    GenericResponse,
    GetAccountResponse, GetSchemaResponse,
    ListDatabasesResponse, PongRes, SelectRes, TxQueryReq, TxQueryRes
} from "../core/resreq";
import { bytesToHex, bytesToString, hexToBytes, stringToBytes } from "../utils/serial";
import { TxInfoReceipt } from "../core/txQuery";

export default class Client extends Api {
    constructor(opts: Config) {
        super(opts.kwilProvider, opts);
    }

    public async getFundingConfig(): Promise<GenericResponse<FundingConfig>> {
        const res = await super.get<FundingConfigRes>(`/api/v1/config`);
        console.log(res)

        return checkRes(res, r => r);
    }

    public async getSchema(dbid: string): Promise<GenericResponse<Database>> {
        const res = await super.get<GetSchemaResponse>(`/api/v1/databases/${dbid}/schema`);
        return checkRes(res, r => r.schema);
    }

    public async getAccount(owner: string): Promise<GenericResponse<Account>> {
        const res = await super.get<GetAccountResponse>(`/api/v1/accounts/${owner}`);
        return checkRes(res, r => r.account);
    }

    public async listDatabases(owner: string): Promise<GenericResponse<string[]>> {
        const res = await super.get<ListDatabasesResponse>(`/api/v1/${owner}/databases`);
        return checkRes(res, r => r.databases);
    }

    public async estimateCost(tx: Transaction): Promise<GenericResponse<string>> {
        let req: EstimateCostReq = {tx}
        const res = await super.post<EstimateCostRes>(`/api/v1/estimate_price`, req);
        return checkRes(res, r => r.price);
    }

    public async broadcast(tx: Transaction): Promise<GenericResponse<TxReceipt>> {
        if (!tx.isSigned()) {
            throw new Error('Tx must be signed before broadcasting.');
        }

        let req: BroadcastReq = {tx}
        const res = await super.post<BroadcastRes>(`/api/v1/broadcast`, req);
        checkRes(res);

        let body = {
            txHash: '0x'
        };

        if (res.data.txHash) {
            const bytes = res.data.txHash;
            body.txHash = bytesToHex(base64ToBytes(bytes))
        }

        return {
            status: res.status,
            data: body
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

    public async txInfo(txHash: string): Promise<GenericResponse<TxInfoReceipt>> {
        txHash = bytesToBase64(hexToBytes(txHash));
        const req: TxQueryReq = { txHash }

        const res = await super.post<TxQueryRes>(`/api/v1/tx_query`, req)
        checkRes(res)

        let body;
        
        if(res.data.hash && res.data.height && res.data.tx && res.data.txResult) {
            body = {
                hash: bytesToHex(base64ToBytes(res.data.hash)),
                height: res.data.height,
                tx: {
                    body: res.data.tx.body,
                    signature: res.data.tx.signature,
                    sender: bytesToHex(base64ToBytes(res.data.tx.sender)),
                },
                txResult: res.data.txResult
            };
        }
        
        return {
            status: res.status,
            data: body
        }
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