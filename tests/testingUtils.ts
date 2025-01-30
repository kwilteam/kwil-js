import { Contract, JsonRpcProvider, JsonRpcSigner, Wallet } from 'ethers';
import { NodeKwil } from '../src/index';
import scrypt from 'scrypt-js';
import nacl from 'tweetnacl';

require('dotenv').config();

const provider = new JsonRpcProvider(process.env.ETH_PROVIDER);
export const wallet = new Wallet(process.env.PRIVATE_KEY as string, provider);

export async function isTestDbDeployed(address: string | Uint8Array): Promise<boolean> {
  const res = await kwil.listDatabases(address);
  const dbList = res.data;
  if (!dbList) return false;
  for (const db of dbList) {
    if (db.name === 'mydb') return true;
  }
  return false;
}

// // TODO: Deploy a test db with namespace, tables, actions
// export async function deployTestDb(signer: KwilSigner): Promise<void> {
//   const body: DeployBody = {
//     schema: mydb,
//   };
//   const res = await kwil.deploy(body, signer, true);
//   const hash = res.data?.tx_hash;
//   if (!hash) throw new Error('No tx hash returned from Kwil Network');
// }

// export async function deployIfNoTestDb(signer: KwilSigner): Promise<void> {
//   const isDeployed = await isTestDbDeployed(signer.identifier);
//   if (!isDeployed) await deployTestDb(signer);
// }

// // TODO: Drop a namespace
// export async function dropTestDb(dbid: string, signer: KwilSigner): Promise<void> {
//   await kwil.drop(
//     {
//       dbid,
//     },
//     signer,
//     true
//   );
// }

export interface ActionObj {
  dbid: string;
  name: string;
  inputs: string[];
}

export interface Escrow {
  contract: Contract;
  provider: Wallet;
  validatorAddress: string;
  tokenAddress: string;
}

export interface Token {
  contract: Contract;
  provider: Wallet | JsonRpcSigner;
  name?: string;
  symbol?: string;
  decimals?: number;
  totalSupply?: number;
}

export interface FunderObj {
  poolAddress: string;
  signer: Wallet;
  providerAddress: string;
  escrowContract: Escrow;
  erc20Contract: Token;
}

export interface AmntObject {
  count: number;
}

export interface schemaObj {
  owner: string;
  name: string;
  tables: object[];
  actions: object[];
}

export interface ActionObj {
  _name: string;
  _dbid: string;
}

export interface ViewCaller {
  caller: string;
}

export const kwil = new NodeKwil({
  kwilProvider: process.env.KWIL_PROVIDER || 'SHOULD FAIL',
  chainId: process.env.CHAIN_ID || 'SHOULD FAIL',
  timeout: 10000,
  logging: true,
  unconfirmedNonce: true,
});

export const deriveKeyPair64 = async (password: string, humanId: string) => {
  const encoder = new TextEncoder();

  const normalizedPassword = encoder.encode(password.normalize('NFKC'));
  const salt = encoder.encode(humanId);

  const derivedKey = await scrypt.scrypt(normalizedPassword, salt, 1024, 8, 1, 32);

  return nacl.sign.keyPair.fromSeed(derivedKey);
};
