import './App.css'
import { deployDb } from './tests/ethersv6/testDeploy';
// import { testV5Funding } from './tests/v5Funding'
import { testV5Transaction } from './tests/ethersv5/v5Signing';
import { kwil } from './tests/testUtils';
import { BrowserProvider } from 'ethers';
import { Utils } from '@lukelamey/kwil-js'
import { executeAction } from './tests/ethersv6/executeAction';
import { testViewWithParam } from './tests/testViewWithParam';
import { testViewWithSign } from './tests/ethersv6/testViewWithSign';
import { dropDatabase } from './tests/ethersv6/dropDatabase';

declare global {
  interface Window {
    ethereum?: any;
  }
}

function App() {

  async function test() {
    const provider = new BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    const pubkey = await Utils.recoverSecp256k1PubKey(signer)
    const dbid = kwil.getDBID(pubkey, 'mydb5')
    // await deployDb(signer, pubkey)
    // await executeAction(kwil, dbid, 'add_post', signer, pubkey)
    // await testViewWithParam(kwil, dbid)
    // await testViewWithSign(kwil, dbid, signer, pubkey)
    // console.log(await kwil.txInfo("0xacb9520af7f2f66aafe4aed15377dd9bb7d77a312aedb47b66d1c9a293c7d098"))
    // console.log(await kwil.listDatabases(pubkey))
    // console.log(await kwil.getSchema(dbid))
    console.log(await kwil.selectQuery(dbid, "SELECT * FROM posts"))
    // console.log(await kwil.ping())
    // console.log(await kwil.getAccount(pubkey))
    // await dropDatabase(kwil, dbid, pubkey, signer)
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
