import 'regenerator-runtime/runtime';
import React from 'react';
import mydb from './mydb.json';
import { WebKwil } from '../../dist';
import './assets/global.css';
import { EducationalText, SignInPrompt, SignOutButton } from './ui-components';
import { keyStores, InMemorySigner } from 'near-api-js';
import { dropDatabase } from './tests/dropDatabase';
import { deployDatabase } from './tests/deployDatabase';
import { executeAction } from './tests/executeAction';
import { testviewWithParam } from './tests/testViewWithParam';
import { testViewWithSign } from './tests/testViewWithSign';
import nacl from 'tweetnacl';
import scrypt from 'scrypt-js';
import { binary_to_base58 } from 'base58-js';
import { KeyPairEd25519 } from '@near-js/crypto';


export default function App({ isSignedIn, contractId, wallet }) {
  const [valueFromBlockchain, setValueFromBlockchain] = React.useState();
  const [uiPleaseWait, setUiPleaseWait] = React.useState(true);

  const kwil = new WebKwil({
    kwilProvider: "http://localhost:8080",
    timeout: 10000,
    logging: true,
  });

  async function getSigner() {
    const keyStore = new keyStores.BrowserLocalStorageKeyStore(window.localStorage);
    const signer = new InMemorySigner(keyStore)
    // signer.createKey(wallet.accountId, 'testnet');

    const pubKey = (await signer.getPublicKey(wallet.accountId, 'testnet')).toString();
    console.log(signer)
    console.log(pubKey)
    return { signer, pubKey }
  }

  async function executeTest() {
    const { signer, pubKey } = await getSigner();
    // const { signer, pubKey } = await customEdKeys();
    const dbid = kwil.getDBID(pubKey, "mydb")
    // await deployDatabase(kwil, signer, pubKey, wallet)
    // await executeAction(kwil, dbid, "add_post", signer, wallet, pubKey)
    // await testviewWithParam(kwil, dbid)
    // await testViewWithSign(kwil, dbid, signer, wallet, pubKey)
    // console.log(await kwil.listDatabases('93807a788636cbe4280b7ee929a7c67d3f765b929a9034cea51fd856232d0588'))
    // console.log(await kwil.getSchema(dbid))
    // console.log(await kwil.getAccount(pubKey))
    // console.log(await kwil.txInfo("9caede7125ded148df15b3f85958e5df1d679e3b9e808cc483db9ec75cfe86d8"));
    // console.log(await kwil.selectQuery(dbid, "SELECT * FROM posts"))
    // console.log(await kwil.ping())
    // await dropDatabase(kwil, "mydb", pubKey, signer, wallet)
    // console.log(await kwil.listDatabases('93807a788636cbe4280b7ee929a7c67d3f765b929a9034cea51fd856232d0588'))
  }

  // Get blockchain state once on component load
  React.useEffect(() => {
    getSignIn()
      .then(setValueFromBlockchain)
      .catch(alert)
      .finally(() => {
        setUiPleaseWait(false);
      });
    }
  , []);

  /// If user not signed-in with wallet - show prompt
  if (!isSignedIn) {
    // Sign-in flow will reload the page later
    return <SignInPrompt greeting={valueFromBlockchain} onClick={() => wallet.signIn()}/>;
  }

 

  function getSignIn(){
    // use the wallet to query the contract's greeting
    return wallet.viewMethod({ method: 'get_greeting', contractId })
  }

  return (
    <>
      <SignOutButton accountId={wallet.accountId} onClick={() => wallet.signOut()}/>
      <main className={uiPleaseWait ? 'please-wait' : ''}>
        <h1>
          The contract says: <span className="greeting">{valueFromBlockchain}</span>
        </h1>
          <label>Click to Sign</label>
          <div>
            <button onClick={() => executeTest()}>
              <span>Sign</span>
              <div className="loader"></div>
            </button>
          </div>
        <EducationalText/>
      </main>
    </>
  );
}