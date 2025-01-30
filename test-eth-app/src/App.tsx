import './App.css';
import { deployDb } from './tests/ethersv6/testDeploy';
// import { testV5Funding } from './tests/v5Funding'
import { testV5Transaction } from './tests/ethersv5/v5Signing';
import { kwil } from './tests/testUtils';
import { BrowserProvider, getBytes } from 'ethers';
import { KwilSigner, Utils } from '../../src/index';
import { executeAction } from './tests/ethersv6/executeAction';
import { testViewWithParam } from './tests/testViewWithParam';
import { testViewWithSign } from './tests/ethersv6/testViewWithSign';
import { dropDatabase } from './tests/ethersv6/dropDatabase';
import { kwilAuthenticate, kwilLogout } from './tests/authenticate';
import { useState } from 'react';
import { bytesToBase64 } from '../../src/utils/base64';
import { encodeTransfer } from '../../src/utils/kwilEncoding';
import { getTxProperties } from './examples/test';
import { encodeRawStatement, RawStatement, Transfer } from './examples/broadcast_payloads';
import { PayloadType } from '../../src/core/enums';
import { encodeScalar } from './examples/encode_scalar';
import { executeActionArray } from './tests/ethersv6/executeActionArray';

declare global {
  interface Window {
    ethereum?: any;
  }
}

function App() {
  async function test() {
    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const kwilSigner = new KwilSigner(signer, signer.address);

    const res = await kwil.getAccount(signer.address);
    const nonce = res.data?.nonce;

    // Convert address to Uint8Array using ethers utility
    // const addressBytes = getBytes(signer.address);
    // console.log(addressBytes);
    // const accountBytesRes = await kwil.getAccount(addressBytes);
    // console.log(accountBytesRes);

    // const res = await kwil.chainInfo();
    // console.log(res);

    // const dbid = kwil.getDBID(signer.address, 'mydb');

    // await deployDb(kwilSigner);
    const namespace = 'test';

    // const transferBody = {
    //   to: {
    //     identifier: 'affdc06cf34afd7d5801a13d48c92ad39609901d',
    //     key_type: 'secp256k1',
    //   },
    //   amount: BigInt(100),
    // };

    // const result = await kwil.funder.transfer(transferBody, kwilSigner, true);
    // console.log(result);

    // await kwil.query('CREATE table simple_test (text_var text PRIMARY KEY);', {}, kwilSigner, true);

    // await kwil.query(
    //   '{test}INSERT INTO missing_table (id, int_var, text_var, bool_var, blob_var) VALUES ($id, $int_var, $text_var, $bool_var, $blob_var)',
    //   {
    //     $id: '123e4567-e89b-12d3-a456-426614174003',
    //     $int_var: 42,
    //     $text_var: 'Sample text',
    //     $bool_var: true,
    //     //$decimal_var: 1234.56,
    //     $blob_var: new Uint8Array([1]),
    //   },
    //   kwilSigner,
    //   true
    // );

    // await testViewWithParam(kwil, namespace, kwilSigner);
    // await executeAction(kwil, namespace, 'insert_variables', kwilSigner, nonce);
    // ./kwil-cli exec-sql -s 'CREATE TABLE saved_arrays(id uuid primary key, text_arr text[], int_arr text[])' --sync
    // await kwil.execSql(
    //   'INSERT INTO saved_arrays_2 (id, text_arr, int_arr) VALUES ($id, $text_arr, $int_arr)',
    //   {
    //     $id: '123e4567-e89b-12d3-a456-426614174001',
    //     $text_arr: ['test', 'test2'],
    //     $int_arr: [1, 2],
    //   },
    //   kwilSigner,
    //   true
    // );

    console.log(
      await kwil.selectQuery('SELECT * FROM saved_arrays_2 WHERE text_arr = $text_arr', {
        $text_arr: ['test', 'test2'],
      })
    );

    await executeActionArray(kwil, 'main', 'insert_saved_arr', kwilSigner, nonce);

    // await kwilAuthenticate(kwil, kwilSigner)
    // await testViewWithSign(kwil, dbid, kwilSigner)
    // await kwilLogout(kwil);
    // console.log(
    //   await kwil.txInfo(
    //     '778ddcd9cdfdd1a7bcdf6edef34d34f77d5ee78e7d6f47de738f3aebad5fe5bf3dd9eddfe76e5e73bebb7bdeb97baf1f'
    //   )
    // );

    // console.log(await kwil.listDatabases(kwilSigner.identifier));
    //console.log(await kwil.getSchema(dbid));

    // console.log(await kwil.selectQuery(dbid, "SELECT * FROM posts"))
    // console.log(await kwil.selectQuery('{main}SELECT * FROM posts'));

    /*
      "123e4567-e89b-12d3-a456-426614174000",
                42,
                "Sample text",
                true,
                "12.3456",
                "AAAAAAAAAAE="
    */

    // Create transfer payload
    // const transferBody = {
    //   to: signer.address, // Can be hex string or Uint8Array
    //   amount: BigInt(5000000000000000000000000000), // Amount in smallest unit (1 = 10^18)
    //   description: 'Optional transfer description',
    // };

    // Execute transfer
    // const result = await kwil.funder.transfer(transferBody, kwilSigner, true);
    // console.log(result);

    // const execResult = await kwil.execSql(
    //   `CREATE ACTION add_post($user text, $title text, $body text) PUBLIC { $id uuid := uuid_generate_v5('455f60aa-0569-4aaa-8469-63be2ec4dd96'::uuid, @txid); INSERT INTO posts (id, name, post_title, post_body) VALUES ($id, $user, $title, $body); }`,
    //   {},
    //   kwilSigner,
    //   true
    // );
    // console.log(execResult);

    // Deprecated
    // await kwil.selectQuery('main', 'SELECT * FROM variable_test');
    // await kwil.selectQuery('{main}SELECT * FROM info.actions');
    // await kwil.selectQuery('{main}SELECT * FROM variable_test WHERE id = $id', {
    //   $id: '123e4567-e89b-12d3-a456-426614174000',
    // });
    // await kwil.selectQuery(
    //   '{test}SELECT * FROM variable_test WHERE id = $id',
    //   {
    //     $id: '123e4567-e89b-12d3-a456-426614174000',
    //   },
    //   kwilSigner
    // );

    // UUID;
    // console.log(
    //   await kwil.selectQuery('{test}SELECT * FROM variable_test WHERE id = $id', {
    //     $id: '123e4567-e89b-12d3-a456-426614174000',
    //   })
    // );

    // INT;
    // console.log(
    //   await kwil.selectQuery('{test}SELECT * FROM variable_test WHERE int_var = $int', {
    //     $int: 42,
    //   })
    // );

    // BOOL;
    // console.log(
    //   await kwil.selectQuery('{test}SELECT * FROM variable_test WHERE bool_var = $bool', {
    //     $bool: true,
    //   })
    // );

    // DECIMAL
    // console.log(
    //   await kwil.selectQuery('{test}SELECT * FROM variable_test WHERE decimal_var = $decimal', {
    //     $decimal: 12.3456,
    //   })
    // );

    // console.log(
    //   await kwil.selectQuery('{test}SELECT * FROM variable_test WHERE decimal_var = $decimal', {
    //     $decimal: 12.3456,
    //   })
    // );

    // BLOB;
    // console.log(
    //   await kwil.selectQuery('{test}SELECT * FROM variable_test WHERE blob_var = $blob', {
    //     $blob: new Uint8Array([1]),
    //   })
    // );

    // TEXT
    // console.log(
    //   await kwil.selectQuery('{test}SELECT * FROM variable_test WHERE text_var = $text', {
    //     $text: 'Sample text',
    //   })
    // );

    // console.log(
    //   await kwil.selectQuery('{main}SELECT * FROM info.columns WHERE table_name = $table_name', {
    //     table_name: 'users',
    //   })
    // );

    // console.log(
    //   await kwil.selectQuery('{martin}SELECT * FROM users WHERE id = $id::int', { id: '1' })
    // );

    // console.log(await kwil.selectQuery('{main}SELECT * FROM users'));

    // console.log(await kwil.ping());
    // console.log(await kwil.getAccount(kwilSigner.identifier));
    // console.log(await kwil.getAccount(kwilSigner.identifier))
    // await dropDatabase(kwil, dbid, kwilSigner)
  }

  return (
    <>
      <h1>Click Button to Test</h1>
      <div className="card">
        <button onClick={() => test()}>Click me!</button>

        <p>
          Edit <code>src/App.tsx</code> to change the function to test.
        </p>
      </div>
    </>
  );
}

export default App;
