import { base64ToBytes, bytesToBase64 } from "../utils/base64";
import { Account } from "../core/account";
import { Database, SelectQuery } from "../core/database";
import { Transaction, TxReceipt } from "../core/tx";
import { Api } from "./api";
import { Config } from "./config";
import {
    BroadcastReq,
    BroadcastRes,
    CallRes,
    EstimateCostReq,
    EstimateCostRes,
    GenericResponse,
    GetAccountResponse, GetSchemaResponse,
    ListDatabasesResponse, PongRes, SelectRes, TxQueryReq, TxQueryRes
} from "../core/resreq";
import { base64UrlEncode, bytesToHex, hexToBytes } from "../utils/serial";
import { TxInfoReceipt } from "../core/txQuery";
import { Message, MsgData, MsgReceipt } from "../core/message";
import { kwilDecode } from "../utils/rlp";

export default class Client extends Api {
    constructor(opts: Config) {
        super(opts.kwilProvider, opts);
    }

    public async getSchema(dbid: string): Promise<GenericResponse<Database>> {
        const res = await super.get<GetSchemaResponse>(`/api/v1/databases/${dbid}/schema`);
        checkRes(res);

        let schema: Database = {
            name: '',
            owner: new Uint8Array(),
            tables: [],
            actions: [],
            extensions: []
        }

        if (res.data) {
            schema = {
                name: res.data.schema.name,
                owner: base64ToBytes(res.data.schema.owner),
                tables: res.data.schema.tables,
                actions: res.data.schema.actions,
                extensions: res.data.schema.extensions
            }
        }

        return {
            status: res.status,
            data: schema
        }
    }

    public async getAccount(owner: Uint8Array): Promise<GenericResponse<Account>> {
        const urlSafeB64 = base64UrlEncode(bytesToBase64(owner));
        const res = await super.get<GetAccountResponse>(`/api/v1/accounts/${urlSafeB64}`);
        checkRes(res);

        let acct: Account = {
            balance: '',
            public_key: new Uint8Array(),
            nonce: '',

        };

        if (res.data) {
            acct.balance = res.data.account.balance;
            acct.public_key = base64ToBytes(res.data.account.public_key as string);
            acct.nonce = res.data.account.nonce;
        }

        return {
            status: res.status,
            data: acct
        }
    }

    public async listDatabases(owner: Uint8Array): Promise<GenericResponse<string[]>> {
        const urlSafeB64 = base64UrlEncode(bytesToBase64(owner));
        const res = await super.get<ListDatabasesResponse>(`/api/v1/${urlSafeB64}/databases`);
        return checkRes(res, r => r.databases);
    }

    public async estimateCost(tx: Transaction): Promise<GenericResponse<string>> {
        let req: EstimateCostReq = { tx }
        const res = await super.post<EstimateCostRes>(`/api/v1/estimate_price`, req);
        return checkRes(res, r => r.price);
    }

    public async broadcast(tx: Transaction): Promise<GenericResponse<TxReceipt>> {
        if (!tx.isSigned()) {
            throw new Error('Tx must be signed before broadcasting.');
        }

        let req: BroadcastReq = { tx }
        const res = await super.post<BroadcastRes>(`/api/v1/broadcast`, req);
        checkRes(res);

        let body = {
            tx_hash: '0x'
        };

        if (res.data.tx_hash) {
            const bytes = res.data.tx_hash;
            body.tx_hash = bytesToHex(base64ToBytes(bytes))
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

    public async txInfo(tx_hash: string): Promise<GenericResponse<TxInfoReceipt>> {
        tx_hash = bytesToBase64(hexToBytes(tx_hash));
        const req: TxQueryReq = { tx_hash }

        const res = await super.post<TxQueryRes>(`/api/v1/tx_query`, req)
        checkRes(res)

        let body;

        if(res.data.hash && res.data.height && res.data.tx && res.data.tx_result) {
            body = {
                hash: bytesToHex(base64ToBytes(res.data.hash)),
                height: res.data.height,
                tx: {
                    body: {
                        payload: kwilDecode(base64ToBytes(res.data.tx.body.payload as string)),
                        payload_type: res.data.tx.body.payload_type,
                        fee: res.data.tx.body.fee,
                        nonce: res.data.tx.body.nonce,
                        salt: base64ToBytes(res.data.tx.body.salt as string),
                    },
                    signature: {
                        signature_bytes: base64ToBytes(res.data.tx.signature.signature_bytes as string),
                        signature_type: res.data.tx.signature.signature_type,
                    },
                    sender: (base64ToBytes(res.data.tx.sender as string)),
                },
                tx_result: res.data.tx_result
            };
        }
        
        return {
            status: res.status,
            data: body
        }
    }
    
    public async call(msg: Message): Promise<GenericResponse<MsgReceipt>> {
        let req: MsgData = {
            payload: msg.payload,
            sender: msg.sender,
            signature: msg.signature
        }

        const res = await super.post<CallRes>(`/api/v1/call`, req);
        checkRes(res);

        let result: any = null;

        if (res.data.result) {
            const uint8 = new Uint8Array(base64ToBytes(res.data.result));
            const decoder = new TextDecoder('utf-8');
            const jsonString = decoder.decode(uint8);
            result = JSON.parse(jsonString);
        }

        const cleanReceipt: MsgReceipt = !result ? {
            result: null
        } : {
            result: result
        };

        return {
            status: res.status,
            data: cleanReceipt
        };
    }
}

function checkRes<T, R>(res: GenericResponse<T>, selector?: (r: T) => R | undefined): GenericResponse<R> {
    if (res.status != 200 || !res.data) {
        throw new Error(JSON.stringify(res.data) || 'An unknown error has occurred.  Please check your network connection.');
    }

    if (!selector) {
        return { status: res.status, data: undefined };
    }

    return {
        status: res.status,
        data: selector(res.data)
    }
}