import './App.css';
import { deployDb } from './tests/ethersv6/testDeploy';
// import { testV5Funding } from './tests/v5Funding'
import { testV5Transaction } from './tests/ethersv5/v5Signing';
import { kwil } from './tests/testUtils';
import { BrowserProvider } from 'ethers';
import { KwilSigner, Utils } from '../../src/index';
import { executeAction } from './tests/ethersv6/executeAction';
import { testViewWithParam } from './tests/testViewWithParam';
import { testViewWithSign } from './tests/ethersv6/testViewWithSign';
import { dropDatabase } from './tests/ethersv6/dropDatabase';
import { kwilAuthenticate, kwilLogout } from './tests/authenticate';

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

    // const res = await kwil.chainInfo();
    // console.log(res);

    // const dbid = kwil.getDBID(signer.address, 'mydb');

    // await deployDb(kwilSigner);
    const namespace = 'test';
    const actionInput = Utils.ActionInput.of()
      .put('$id', 'f47ac10b-58cc-4372-a567-0e02b2c3d479')
      .put('$int_var', 42)
      .put('$text_var', 'Sample text')
      .put('$bool_var', true)
      .put('$decimal_var', '12.3456')
      .put('$blob', new Uint8Array([1]));

    // await executeAction(kwil, namespace, 'insert_variables', actionInput, kwilSigner);
    await testViewWithParam(kwil, namespace, kwilSigner);
    // await kwilAuthenticate(kwil, kwilSigner)
    // await testViewWithSign(kwil, dbid, kwilSigner)
    // await kwilLogout(kwil);
    // console.log(
    //   await kwil.txInfo('f66d86c28a866fc23e6dc6f099f8871a2db7378706572c9a7adcc905fa2309b0')
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

    // console.log(await kwil.getTables('main'));
    // console.log(await kwil.getTableColumns('main', 'variable_test'));
    // console.log(await kwil.getActions('action_test'));
    // console.log(await kwil.getExtensions('action_test'));

    // Deprecated
    // await kwil.selectQuery('main', 'SELECT * FROM variable_test');
    // await kwil.selectQuery('SELECT * FROM variable_test');
    // await kwil.selectQuery('{main}SELECT * FROM variable_test WHERE id = $id', {
    //   $id: '123e4567-e89b-12d3-a456-426614174000',
    // });
    // await kwil.selectQuery(
    //   '{main}SELECT * FROM variable_test WHERE id = $id',
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
    //   await kwil.selectQuery('{main}SELECT * FROM variable_test WHERE int_var = $int', {
    //     $int: 42,
    //   })
    // );

    // BOOL;
    // console.log(
    //   await kwil.selectQuery('{main}SELECT * FROM variable_test WHERE bool_var = $bool', {
    //     $bool: true,
    //   })
    // );

    // DECIMAL
    // console.log(
    //   await kwil.selectQuery('{main}SELECT * FROM variable_test WHERE decimal_var = $decimal', {
    //     $decimal: 12.3456,
    //   })
    // );

    // BLOB;
    // console.log(
    //   await kwil.selectQuery('{main}SELECT * FROM variable_test WHERE blob_var = $blob', {
    //     $blob: new Uint8Array([1]),
    //   })
    // );

    // TEXT
    // console.log(
    //   await kwil.selectQuery('{main}SELECT * FROM variable_test WHERE text_var = $text', {
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
