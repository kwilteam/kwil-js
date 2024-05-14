import { base64ToBytes, bytesToBase64 } from '../utils/base64';
import { Account, ChainInfo, DatasetInfo } from '../core/network';
import { Database, SelectQuery } from '../core/database';
import { Transaction, TxReceipt } from '../core/tx';
import { Api } from './api';
import { ClientConfig } from './config';
import {
  BroadcastReq,
  BroadcastRes,
  CallRes,
  ChainInfoRes,
  EstimateCostReq,
  EstimateCostRes,
  GenericResponse,
  GetAccountResponse,
  GetAuthResponse,
  GetSchemaResponse,
  ListDatabasesResponse,
  PongRes,
  PostAuthResponse,
  SelectRes,
  TxQueryReq,
  TxQueryRes,
} from '../core/resreq';
import { base64UrlEncode, bytesToHex, hexToBytes } from '../utils/serial';
import { TxInfoReceipt } from '../core/txQuery';
import { Message, MsgData, MsgReceipt } from '../core/message';
import { kwilDecode } from '../utils/rlp';
import { BroadcastSyncType, BytesEncodingStatus, EnvironmentType } from '../core/enums';
import { AuthInfo, AuthSuccess, AuthenticatedBody, LogoutResponse } from '../core/auth';
import { AxiosResponse } from 'axios';

export default class Client extends Api {
  private unconfirmedNonce: boolean;

  constructor(opts: ClientConfig) {
    super(opts);
    this.unconfirmedNonce = opts.unconfirmedNonce || false;
  }

  protected async getSchemaClient(dbid: string): Promise<GenericResponse<Database>> {
    const res = await super.get<GetSchemaResponse>(`/api/v1/databases/${dbid}/schema`);
    checkRes(res);

    let schema: Database = {
      name: '',
      owner: new Uint8Array(),
      tables: [],
      actions: [],
      extensions: [],
    };

    if (res.data) {
      schema = {
        name: res.data.schema.name,
        owner: base64ToBytes(res.data.schema.owner),
        tables: res.data.schema.tables,
        actions: res.data.schema.actions,
        extensions: res.data.schema.extensions,
      };
    }

    return {
      status: res.status,
      data: schema,
    };
  }

  protected async getAuthenticateClient(): Promise<GenericResponse<AuthInfo>> {
    const res = await super.get<GetAuthResponse>(`/auth`);
    return checkRes(res, (r) => r.result);
  }

  protected async postAuthenticateClient<T extends EnvironmentType>(
    body: AuthenticatedBody<BytesEncodingStatus.BASE64_ENCODED>
  ): Promise<GenericResponse<AuthSuccess<T>>> {
    const res = await super.post<PostAuthResponse>(`/auth`, body);
    checkRes(res);
    
    if (typeof window === 'undefined') {
      const cookie = res.headers['set-cookie'];
      if (!cookie) {
        throw new Error('No cookie received from gateway. An error occured with authentication.');
      }

      // set the cookie
      this.cookie = cookie[0];

      // if we are in nodejs, we need to return the cookie
      return {
        status: res.status,
        // @ts-ignore
        data: {
          result: res.data.result,
          cookie: cookie[0],
        },
      };
    }

    // if we are in the browser, we don't need to return the cookie
    return {
      status: res.status,
      data: {
        result: res.data.result,
      },
    };
  }

  protected async logoutClient<T extends EnvironmentType>(identifier?: Uint8Array): Promise<
    GenericResponse<LogoutResponse<T>>
  > {
    let logoutExt = '';

    if (identifier) {
      // KGW expects the identifier to be hex encoded
      logoutExt = `?account=${bytesToHex(identifier)}`;
    }

    const res = await super.get<LogoutResponse<T>>(`/logout${logoutExt}`);
    checkRes(res);

    // if we are in nodejs, we need to return the cookie
    if (typeof window === 'undefined') {
      const cookie = res.headers['set-cookie'];
      if (!cookie) {
        throw new Error('No cookie received from gateway. An error occured with authentication.');
      }

      if (cookie[0].startsWith('kgw_session=;')) {
        this.cookie = undefined;
      } else {
        // set the cookie
        this.cookie = cookie[0];
      }

      return {
        status: res.status,
        // @ts-ignore
        data: {
          result: res.data.result,
          cookie: cookie[0],
        },
      };
    }

    // if we are in the browser, we don't need to return the cookie - the browser will handle it
    return {
      status: res.status,
      data: {
        result: res.data.result,
      },
    };
  }

  protected async getAccountClient(owner: Uint8Array): Promise<GenericResponse<Account>> {
    const urlSafeB64 = base64UrlEncode(bytesToBase64(owner));
    const unconfirmedNonce = this.unconfirmedNonce ? '?status=1' : '';
    const res = await super.get<GetAccountResponse>(
      `/api/v1/accounts/${urlSafeB64}` + unconfirmedNonce
    );
    checkRes(res);

    let acct: Account = {
      balance: '',
      identifier: new Uint8Array(),
      nonce: '',
    };

    if (res.data) {
      acct.balance = res.data.account.balance;
      acct.identifier = base64ToBytes(res.data.account.identifier as string);
      acct.nonce = res.data.account.nonce;
    }

    return {
      status: res.status,
      data: acct,
    };
  }

  protected async listDatabasesClient(owner?: Uint8Array): Promise<GenericResponse<DatasetInfo[]>> {
    let urlSafeB64 = '';

    if (owner) {
      urlSafeB64 = base64UrlEncode(bytesToBase64(owner));
    }

    const res = await super.get<ListDatabasesResponse>(`/api/v1/${urlSafeB64}/databases`);

    //convert base64 identifiers to Uint8Array
    const convertedRes: AxiosResponse<{ databases: DatasetInfo[] }> = {
      ...res,
      data: {
        databases: res.data.databases.map((db) => {
          return {
            ...db,
            owner: base64ToBytes(db.owner),
          };
        }),
      },
    };

    return checkRes(convertedRes, (r) => r.databases);
  }

  protected async estimateCostClient(tx: Transaction): Promise<GenericResponse<string>> {
    let req: EstimateCostReq = { tx: tx.txData };

    const res = await super.post<EstimateCostRes>(`/api/v1/estimate_price`, req);
    return checkRes(res, (r) => r.price);
  }

  protected async broadcastClient(
    tx: Transaction,
    broadcastSync?: BroadcastSyncType
  ): Promise<GenericResponse<TxReceipt>> {
    if (!tx.isSigned()) {
      throw new Error('Tx must be signed before broadcasting.');
    }

    const req: BroadcastReq = {
      tx: tx.txData,
      ...(broadcastSync !== (null || undefined) ? { sync: broadcastSync } : {}),
    };

    const res = await super.post<BroadcastRes>(`/api/v1/broadcast`, req);
    checkRes(res);

    let body = {
      tx_hash: '',
    };

    if (res.data.tx_hash) {
      const bytes = res.data.tx_hash;
      body.tx_hash = bytesToHex(base64ToBytes(bytes));
    }

    //TODO: Should we always be returning body, regardless of
    return {
      status: res.status,
      data: body,
    };
  }

  protected async pingClient(): Promise<GenericResponse<string>> {
    const res = await super.get<PongRes>(`/api/v1/ping`);
    return checkRes(res, (r) => r.message);
  }

  protected async chainInfoClient(): Promise<GenericResponse<ChainInfo>> {
    const res = await super.get<ChainInfoRes>(`/api/v1/chain_info`);
    return checkRes(res, (r) => r);
  }

  protected async selectQueryClient(query: SelectQuery): Promise<GenericResponse<string>> {
    const res = await super.post<SelectRes>(`/api/v1/query`, query);
    return checkRes(res, (r) => r.result);
  }

  protected async txInfoClient(tx_hash: string): Promise<GenericResponse<TxInfoReceipt>> {
    tx_hash = bytesToBase64(hexToBytes(tx_hash));
    const req: TxQueryReq = { tx_hash };

    const res = await super.post<TxQueryRes>(`/api/v1/tx_query`, req);
    checkRes(res);

    let body;

    if (res.data.hash && res.data.height && res.data.tx && res.data.tx_result) {
      body = {
        hash: bytesToHex(base64ToBytes(res.data.hash)),
        height: res.data.height,
        tx: {
          body: {
            payload: kwilDecode(base64ToBytes(res.data.tx.body.payload as string)),
            payload_type: res.data.tx.body.payload_type,
            fee: res.data.tx.body.fee ? BigInt(res.data.tx.body.fee) : null,
            nonce: res.data.tx.body.nonce,
            chain_id: res.data.tx.body.chain_id,
            description: res.data.tx.body.description,
          },
          signature: {
            signature_bytes: base64ToBytes(res.data.tx.signature.signature_bytes as string),
            signature_type: res.data.tx.signature.signature_type,
          },
          sender: base64ToBytes(res.data.tx.sender as string),
          serialization: res.data.tx.serialization,
        },
        tx_result: res.data.tx_result,
      };
    }

    return {
      status: res.status,
      data: body,
    };
  }

  protected async callClient(msg: Message): Promise<GenericResponse<MsgReceipt>> {
    let req: MsgData<BytesEncodingStatus.BASE64_ENCODED> = {
      body: msg.body,
      auth_type: msg.auth_type,
      sender: msg.sender,
    };

    const res = await super.post<CallRes>(`/api/v1/call`, req);

    // if we get a 401, we need to return the response so we can try to authenticate
    if (res.status !== 401) {
      checkRes(res);
    }

    let result: any = null;

    if (res.data.result) {
      const uint8 = new Uint8Array(base64ToBytes(res.data.result));
      const decoder = new TextDecoder('utf-8');
      const jsonString = decoder.decode(uint8);
      result = JSON.parse(jsonString);
    }

    const cleanReceipt: MsgReceipt = !result
      ? {
          result: null,
        }
      : {
          result: result,
        };

    return {
      status: res.status,
      data: cleanReceipt,
    };
  }
}

function checkRes<T, R>(
  res: GenericResponse<T>,
  selector?: (r: T) => R | undefined
): GenericResponse<R> {
  if (res.status != 200 || !res.data) {
    throw new Error(
      JSON.stringify(res.data) ||
        'An unknown error has occurred.  Please check your network connection.'
    );
  }

  if (!selector) {
    return { status: res.status, data: undefined };
  }

  return {
    status: res.status,
    data: selector(res.data),
  };
}
