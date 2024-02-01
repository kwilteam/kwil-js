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
import { JsonRpcSigner } from 'ethers';

declare global {
  interface Window {
    ethereum?: any;
  }
}

function App() {
  async function test() {
    const provider = new BrowserProvider(window.ethereum)
    const ethSigner = await provider.getSigner()
    const signer = new KwilSigner(ethSigner, ethSigner.address);
    const dbid = kwil.getDBID(signer.identifier, 'mydb5')
    // await deployDb(signer)
    // await executeAction(kwil, dbid, 'add_post', signer)
    // await testViewWithParam(kwil, dbid)
    // await testViewWithSign(kwil, dbid, signer)
    // console.log(await kwil.txInfo("47b616daf28363746f820e56b3d29917bce3230176879fd072cccd07c72462bb"))
    // console.log(await kwil.listDatabases(signer.identifier))
    // console.log(await kwil.getSchema(dbid))
    // console.log(await kwil.selectQuery(dbid, "SELECT * FROM posts"))
    // console.log(await kwil.ping())
    // console.log(await kwil.getAccount(signer.identifier))
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
