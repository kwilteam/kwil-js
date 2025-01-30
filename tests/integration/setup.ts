import { v4 as uuidV4 } from 'uuid';
import { KwilSigner } from '../../dist/index';
import dotenv from 'dotenv';
import { kwil, wallet, deriveKeyPair64 } from '../testingUtils';
import { TxReceipt } from '../../dist/core/tx';
import { Wallet } from 'ethers';

dotenv.config();

const isKgwOn = process.env.GATEWAY_ON === 'TRUE';
const isKwildPrivateOn = process.env.PRIVATE_MODE === 'TRUE';
const isGasOn = process.env.GAS_ON === 'TRUE';
const address = wallet.address;
const kwilSigner = new KwilSigner(wallet, address);
const differentKwilSigner = new KwilSigner(wallet, '0xC0B84D0E05c59e48110577F8Ec2EEE360F804371');

export const createVariableTestSchema = async (namespace: string, actions: any[]) => {
  const result = await kwil.execSql(`CREATE NAMESPACE ${namespace};`, {}, kwilSigner);
  expect(result.data).toMatchObject<TxReceipt>({
    tx_hash: expect.any(String),
  });

  // Create table
  const createTable = `${namespace} CREATE TABLE var_table (
      uuid_col uuid PRIMARY KEY,
      text_col text,
      int_col int,
      bool_col bool,
      dec_col numeric(5,2),
      big_dec_col numeric(20,10),
      blob_col bytea
    );`;

  const tableResult = await kwil.execSql(createTable, {}, kwilSigner, true);
  expect(tableResult.data).toMatchObject<TxReceipt>({
    tx_hash: expect.any(String),
  });

  for (const action of actions) {
    const actionResult = await kwil.execSql(action.sql, {}, kwilSigner, true);
    expect(actionResult.data).toMatchObject<TxReceipt>({
      tx_hash: expect.any(String),
    });
  }
};

export {
  kwil,
  wallet,
  deriveKeyPair64,
  isKgwOn,
  isKwildPrivateOn,
  isGasOn,
  address,
  kwilSigner,
  differentKwilSigner,
  uuidV4,
};
