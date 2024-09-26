import { Contract, JsonRpcProvider, JsonRpcSigner, Wallet } from 'ethers';
import { KwilSigner, NodeKwil } from '../dist';
import scrypt from 'scrypt-js';
import nacl from 'tweetnacl';
import mydb from '../testing-functions/mydb.json';
import baseSchema from '../testing-functions/base_schema.json';
import { DeployBody } from '../dist/core/database';
import { CompiledKuneiform } from '../dist/core/payload';
import { GenericResponse } from '../dist/core/resreq';
import { TxReceipt } from '../dist/core/tx';
import { DatasetInfo } from '../dist/core/network';
import { TxInfoReceipt } from '../dist/core/txQuery';
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

export async function deployTestDb(signer: KwilSigner): Promise<void> {
  const body: DeployBody = {
    schema: mydb,
  };
  const res = await kwil.deploy(body, signer, true);
  const hash = res.data?.tx_hash;
  if (!hash) throw new Error('No tx hash returned from Kwil Network');
}

export async function deployBaseSchema(signer: KwilSigner): Promise<void> {
  const { data } = await kwil.listDatabases(signer.identifier);
  if (!data) throw new Error('No data returned from list databases call');
  let isBaseSchemaDeployed = false;

  for (const db of data) {
    if (db.name === 'base_schema') {
      isBaseSchemaDeployed = true;
      break;
    }
  }

  if (!isBaseSchemaDeployed) {
    await kwil.deploy(
      {
        schema: baseSchema,
      },
      signer,
      true
    );
  }
}

export async function deployIfNoTestDb(signer: KwilSigner): Promise<void> {
  const isDeployed = await isTestDbDeployed(signer.identifier);
  if (!isDeployed) await deployTestDb(signer);
}

export async function deployTempSchema(
  schema: CompiledKuneiform,
  signer: KwilSigner
): Promise<GenericResponse<TxReceipt>> {
  const dbAmount = await kwil.listDatabases(signer.identifier);
  const count = dbAmount.data as DatasetInfo[];
  schema.name = `test_db_${count.length + 1}`;
  const payload: DeployBody = {
    schema,
  };
  const res = await kwil.deploy(payload, signer, true);
  const hash = res.data?.tx_hash;
  if (!hash) throw new Error('No hash returned from deploy');
  return res;
}

export async function dropTestDb(dbid: string, signer: KwilSigner): Promise<void> {
  await kwil.drop(
    {
      dbid,
    },
    signer,
    true
  );
}

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

let txQueryTries: number = 0;

export async function waitForDeployment(hash?: string): Promise<void> {
  if (!hash) throw new Error('No hash provided to waitForDeployment');

  // checks status of tx
  let txQuery: GenericResponse<TxInfoReceipt>;
  try {
    txQuery = await kwil.txInfo(hash);
  } catch (error) {
    let e = (error as object).toString();
    console.log(e);
    if (e.includes('transaction not found')) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return waitForDeployment(hash);
    }
    throw new Error(`Error querying transaction: ${error}`);
  }

  // retrieve the log from the tx
  const log = txQuery.data?.tx_result.log;
  if (log === null) {
    throw new Error(
      'Cannot retrieve log from test Kwil Network - please reach out in the Kwil Discord'
    );
  }

  // if tx is successful, resolve
  if (txQuery.status === 200 && log === 'success') {
    txQueryTries = 0;
    return; // Resolves the promise
  }

  // if log is empty string, it means tx is still pending
  if (txQuery.status === 200 && log == '') {
    if (txQueryTries > 30) {
      txQueryTries = 0;
      throw new Error(`Transaction timed out - ${JSON.stringify(bigIntoToString(txQuery))}`);
    }
    txQueryTries++;
    // Wait for a bit before the next check
    await new Promise((resolve) => setTimeout(resolve, 500));
    return waitForDeployment(hash);
  }

  // if log is not empty string and not success, reject
  if (txQuery.status === 200 && log !== 'success') {
    txQueryTries = 0;
    throw new Error(`Transaction failed with log: ${log}`);
  }
}

export const deriveKeyPair64 = async (password: string, humanId: string) => {
  const encoder = new TextEncoder();

  const normalizedPassword = encoder.encode(password.normalize('NFKC'));
  const salt = encoder.encode(humanId);

  const derivedKey = await scrypt.scrypt(normalizedPassword, salt, 1024, 8, 1, 32);

  return nacl.sign.keyPair.fromSeed(derivedKey);
};

// recursively convert bigint to string
function bigIntoToString(obj: any): any {
  if (typeof obj === 'bigint') return obj.toString();
  if (typeof obj === 'object') {
    for (const key in obj) {
      obj[key] = bigIntoToString(obj[key]);
    }
  }
  return obj;
}
