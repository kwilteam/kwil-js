import { BrowserProvider, Wallet } from 'ethers';
import { KwilSigner, NodeKwil, Utils } from '../dist/index';
import { ActionBody } from '../dist/core/action';
import { DeployBody, DropBody } from '../dist/core/database';
import compiledKf from './mydb.json';
import nilKf from './nil.kf.json';
import { TransferBody } from '../dist/funder/funding_types';
require('dotenv').config();

const kwil = new NodeKwil({
  kwilProvider: process.env.KWIL_PROVIDER as string,
  chainId: process.env.CHAIN_ID as string,
  logging: true,
});

console.log(kwil)

import { JsonRpcProvider } from 'ethers';

// add window.ethereum to typeof globalthis
declare global {
  interface Window {
    ethereum: any;
  }
} 

async function buildSigner() {
    const wallet = new Wallet(process.env.PRIVATE_KEY as string)
    return new KwilSigner(wallet, await wallet.getAddress());
}

async function main() {
  const signer = await buildSigner();

  // actions
  const actionBody: ActionBody = {
    dbid: kwil.getDBID(signer.identifier, 'mydb'),
    action: 'add_post',
    inputs: [
      {
        $id: 69,
        $user: 'Luke',
        $title: 'Test Post',
        $body: 'This is a test post',
      },
    ],
    description: 'Add a post',
  };

  // execute
  // await kwil.execute(actionBody, signer);

  //call with signer
  // const callRes = await kwil.call(actionBody, signer);
  // console.log(callRes);

  //call without signer
  // await kwil.call(actionBody);

  // deploy database
  const deployBody: DeployBody = {
    schema: nilKf,
    description: 'My first database',
  };

  // deploy
  // await kwil.deploy(deployBody, signer, true);

  // drop database
  const dropBody: DropBody = {
    dbid: 'abc123',
    description: 'Drop this database',
  };

  // drop
  // await kwil.drop(dropBody, signer);

  const funderTest: TransferBody = {
    to: '0xdB8C53Cd9be615934da491A7476f3f3288d98fEb',
    amount: BigInt(1 * 10 ** 18),
  };

  // transfer
  // const res = await kwil.funder.transfer(funderTest, signer);
  // console.log(res);
}

// main();

async function nilTest() {
  const signer = await buildSigner();
  // await kwil.deploy({ schema: nilKf }, signer, true);
  const { data } = await kwil.selectQuery(
    kwil.getDBID(signer.identifier, 'nil_error'),
    'SELECT COUNT(*) FROM nil_table'
  )

  console.log(data);

  //@ts-ignore
  const count = data[0]['count'];
  console.log(`Count: ${count}`);

  let oneHundredInputs: any[] = [];

  for (let i = 1; i < 1000; i++) {
    oneHundredInputs.push({
      // random 10000000000000 digit number
      $id: Math.floor(Math.random() * 10000000000000),
      $msg: null,
    });
  }

  const res = await kwil.execute(
    {
      dbid: kwil.getDBID(signer.identifier, 'nil_error'),
      action: 'insert_record',
      inputs: oneHundredInputs,
    },
    signer,
    true
  );

  console.log(res);

  // const test = await kwil.selectQuery(
  //   kwil.getDBID(signer.identifier, 'nil_error'),
  //   'SELECT * FROM nil_table'
  // )

  // console.log(test.data);
}

nilTest();
