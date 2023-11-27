import './App.css'
import { deployDb } from './tests/ethersv6/testDeploy';
// import { testV5Funding } from './tests/v5Funding'
import { testV5Transaction } from './tests/ethersv5/v5Signing';
import { kwil } from './tests/testUtils';
import { BrowserProvider } from 'ethers';
import { KwilSigner, Utils } from '@lukelamey/kwil-js'
import { executeAction } from './tests/ethersv6/executeAction';
import { testViewWithParam } from './tests/testViewWithParam';
import { testViewWithSign } from './tests/ethersv6/testViewWithSign';
import { dropDatabase } from './tests/ethersv6/dropDatabase';
import { kwilAuthenticate } from './tests/authenticate';

declare global {
  interface Window {
    ethereum?: any;
  }
}

function App() {

  async function test() {
    const provider = new BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    const pubkey = "0x048767310544592e33b2fb5555527f49c0902cf0f472f4c87e65324abb75e7a5e1c035bc1ef5026f363c79588526c341af341a68fc37299183391699ee1864cc75"
    const kwilSigner = new KwilSigner(signer, pubkey)
    const dbid = kwil.getDBID(pubkey, 'mydb5')
    // await deployDb(signer, pubkey)
    // await executeAction(kwil, dbid, 'add_post', signer, pubkey)
    // await testViewWithParam(kwil, dbid)
    // await kwilAuthenticate(kwil, kwilSigner)
    // await testViewWithSign(kwil, dbid, signer, pubkey)
    // console.log(await kwil.txInfo("47b616daf28363746f820e56b3d29917bce3230176879fd072cccd07c72462bb"))
    // console.log(await kwil.listDatabases(pubkey))
    // console.log(await kwil.getSchema(dbid))
    // console.log(await kwil.selectQuery(dbid, "SELECT * FROM posts"))
    // console.log(await kwil.ping())
    // console.log(await kwil.getAccount(pubkey))
    await dropDatabase(kwil, dbid, pubkey, signer)
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
