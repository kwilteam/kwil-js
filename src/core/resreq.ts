import { Database } from './database';
import { Account, ChainInfo, DatasetInfoServer } from './network';
import { BaseTransaction, TxReceipt, TxnData } from './tx';
import { TxResult } from './txQuery';
import { BroadcastSyncType, BytesEncodingStatus } from './enums';
import { AuthInfo } from './auth';

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
  databases?: DatasetInfoServer[];
}

export interface EstimateCostReq {
  tx: TxnData<BytesEncodingStatus.BASE64_ENCODED>;
}

export interface EstimateCostRes {
  price: string;
}

export interface BroadcastReq {
  tx: TxnData<BytesEncodingStatus.BASE64_ENCODED>;
  sync?: BroadcastSyncType;
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

export interface GetAuthResponse {
  result: AuthInfo;
}

export interface PostAuthResponse{
  result: string;
}

export interface ChainInfoRes extends ChainInfo {}
