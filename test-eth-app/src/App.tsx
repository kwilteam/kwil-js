import './App.css'
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
    const provider = new BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    const kwilSigner = new KwilSigner(signer, signer.address)
    const dbid = kwil.getDBID(signer.address, 'mydb')
    // await deployDb(kwilSigner)
    // await executeAction(kwil, dbid, 'add_post', kwilSigner)
    // await testViewWithParam(kwil, dbid)
    // await kwilAuthenticate(kwil, kwilSigner)
    // await testViewWithSign(kwil, dbid, kwilSigner)
    // await kwilLogout(kwil);
    console.log(await kwil.txInfo("79df1f6fae5f6b6ef9f1b6b4f37739e9f6bcd377fdefb6b9f347f57f4eb8e5ae5ee77d37eba736f5aef9db67367f7eb5"))
    // console.log(await kwil.listDatabases(kwilSigner.identifier))
    // console.log(await kwil.getSchema(dbid))
    // console.log(await kwil.selectQuery(dbid, "SELECT * FROM posts"))
    // console.log(await kwil.ping())
    // console.log(await kwil.getAccount(kwilSigner.identifier))
    // await dropDatabase(kwil, dbid, kwilSigner)
  }


  return (
    <>
      <h1>Click Button to Test</h1>
      <div className="card">
        <button onClick={() => test()}>
          Click me!
        </button>
        <p>
          Edit <code>src/App.tsx</code> to change the function to test.
        </p>
      </div>
    </>
  )
}

export default App
