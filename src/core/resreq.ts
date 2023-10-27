import { Database } from './database';
import { Account, ChainInfo } from './network';
import { BaseTransaction, TxReceipt, TxnData } from './tx';
import { TxResult } from './txQuery';
import { BytesEncodingStatus } from './enums';

type SchemaRes = Database & {
  owner: string;
};

export interface GenericResponse<T> {
  status: number;
  data?: T;
}

export interface GetSchemaResponse {
  schema: SchemaRes;
}

export interface GetAccountResponse {
  account: Account;
}

export interface ListDatabasesResponse {
  databases: string[];
}

export interface EstimateCostReq {
  tx: TxnData<BytesEncodingStatus.BASE64_ENCODED>;
}

export interface EstimateCostRes {
  price: string;
}

export interface BroadcastReq {
  tx: TxnData<BytesEncodingStatus.BASE64_ENCODED>;
}

export interface BroadcastRes extends TxReceipt {}

export interface CallRes {
  result: string;
}

export interface PongRes {
  message: string;
}

export interface SelectRes {
  result: string;
}

export interface TxQueryReq {
  tx_hash: string;
}

export interface TxQueryRes {
  hash: string;
  height: number;
  tx: BaseTransaction<BytesEncodingStatus.BASE64_ENCODED>;
  tx_result: TxResult;
}

export interface ChainInfoRes extends ChainInfo {}