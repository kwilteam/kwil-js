import { Base64String, HexString } from "../utils/types";
import { AuthInfo, AuthenticatedBody } from "./auth";
import { Database } from "./database";
import { BroadcastSyncType, BytesEncodingStatus } from "./enums";
import { MsgData } from "./message";
import { ChainInfo, DatasetInfoServer } from "./network";
import { TxnData } from "./tx";
import { TxResult } from "./txQuery";

export interface JsonRPCRequest<T> {
    jsonrpc: string;
    id: number;
    method: JSONRPCMethod;
    params: T;
}

export enum JSONRPCMethod {
    // TODO: Should we implement version? It hasn't historically existed on Kwil-JS, but i notice it in kwil-db.
    METHOD_HEALTH = 'user.health',
    METHOD_PING = 'user.ping',
    METHOD_CHAIN_INFO = 'user.chain_info',
    METHOD_ACCOUNT = 'user.account',
    METHOD_BROADCAST = 'user.broadcast',
    METHOD_CALL = 'user.call',
    METHOD_DATABASES = 'user.databases',
    METHOD_PRICE = 'user.estimate_price',
    METHOD_QUERY = 'user.query',
    METHOD_TX_QUERY = 'user.tx_query',
    METHOD_SCHEMA = 'user.schema',
    METHOD_KGW_PARAM = 'kgw.authn_param',
    METHOD_KGW_AUTHN = 'kgw.authn',
    METHOD_KGW_LOGOUT = 'kgw.logout',
    METHOD_CHALLENGE  = 'user.challenge',
}

export interface SchemaRequest {
    dbid: string;
}

export interface AccountRequest {
    identifier: HexString;
    status: AccountStatus;
}

// For checking the unconfirmed nonce
export enum AccountStatus {
    // returns the latest confirmed nonce
    LATEST = 0,
    // returns the latest unconfirmed nonce
    PENDING = 1,
}

export interface BroadcastRequest {
    tx: TxnData<BytesEncodingStatus.BASE64_ENCODED>;
    sync?: BroadcastSyncType;
}

export type CallRequest = MsgData<BytesEncodingStatus.BASE64_ENCODED>;

export type ChainInfoRequest = EmptyRequest;

export type ChallengeRequest = EmptyRequest;

export type HealthRequest = EmptyRequest;

interface EmptyRequest {
    [key: string]: never;
}

export interface ListDatabasesRequest {
    owner?: HexString;
}

export interface PingRequest {
    message: string;
}

export interface EstimatePriceRequest {
    tx: TxnData<BytesEncodingStatus.BASE64_ENCODED>;
}

export interface QueryRequest {
    dbid: string;
    query: string;
}

export interface TxQueryRequest {
    tx_hash: string;
}

export interface JsonRPCResponse<T> {
    jsonrpc: string;
    id: number;
    result: T;
    error?: JsonRPCError;
}

interface JsonRPCError {
    code: number;
    message: string;
    data?: object;
}

export interface SchemaResponse {
    schema: Database & {
        owner: string;
    }
}

export interface AccountResponse {
    identifier?: HexString;
    balance: string;
    nonce: number;
}

export interface BroadcastResponse {
    tx_hash: Base64String;
}

export type CallResponse = Result;
export type ChallengeResponse = Result;
export type QueryResponse = Result;
export type HealthResponse = Result;

interface Result {
    result: Base64String;
    challenge?: string
    mode?: string
}

export interface ChainInfoResponse {
    chain_id: string;
    block_height: number;
    block_hash: string;
}

export interface ListDatabasesResponse {
    databases?: DatasetInfoServer[];
}

export interface PingResponse {
    message: string;
}

export interface EstimatePriceResponse {
    price: string;
}

export interface TxQueryResponse {
    hash: string;
    height: number;
    tx: TxnData<BytesEncodingStatus.BASE64_ENCODED>;
    tx_result: TxResult;
}

export type AuthParamRequest = EmptyRequest;

export type AuthParamResponse = AuthInfo;

export type AuthnRequest = AuthenticatedBody<BytesEncodingStatus.HEX_ENCODED>;

export interface AuthnResponse {
    result: string
}

export interface AuthnLogoutRequest {
    account: Base64String;
}