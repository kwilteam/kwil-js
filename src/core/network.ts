// network.ts contains interfaces for network-related data structures.

import { Base64String } from '../utils/types';
import { AccountKeyType, BytesEncodingStatus } from './enums';

// TODO: Support for other key types / string
export interface AccountId {
  identifier: string;
  key_type: AccountKeyType | string;
}

export interface Account {
  id?: AccountId;
  balance: string;
  nonce: number;
}

export interface ChainInfo {
  chain_id: string;
  height: string;
  hash: string;
}

export interface ChainInfoOpts {
  disableWarning?: boolean;
}

export type DatasetInfo = DatasetInfoBase<BytesEncodingStatus.HEX_ENCODED>;

export type DatasetInfoServer = DatasetInfoBase<BytesEncodingStatus.BASE64_ENCODED>;

export interface DatasetInfoBase<T extends BytesEncodingStatus> {
  name: string;
  owner: T extends BytesEncodingStatus.BASE64_ENCODED ? Base64String : Uint8Array;
  dbid: string;
}
