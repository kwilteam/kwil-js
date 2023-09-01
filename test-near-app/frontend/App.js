import 'regenerator-runtime/runtime';
import React from 'react';
import mydb from './mydb.json';
import { WebKwil } from '../../dist';
import './assets/global.css';
import { EducationalText, SignInPrompt, SignOutButton } from './ui-components';
import { keyStores, InMemorySigner } from 'near-api-js';


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
    
    console.log(wallet.accountId)
    const pubKey = (await signer.getPublicKey(wallet.accountId, 'testnet')).toString();
    console.log(pubKey)

    return { signer, pubKey }
  }

  async function deployDatabase() {
    const { signer, pubKey } = await getSigner();
    const tx = await kwil
      .dbBuilder()
      .payload(mydb)
      .signer(signer)
      .publicKey('93807a788636cbe4280b7ee929a7c67d3f765b929a9034cea51fd856232d0588')
      .nearConfig({
        accountId: wallet.accountId,
        networkId: 'testnet',
      })
      .buildTx()

      console.log(await kwil.broadcast(tx))

    // console.log(await kwil.listDatabases('65fac67262d84e4db4321552522b9463ed1cb503b874fd0e94594062da3451d0'))
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
            <button onClick={() => deployDatabase()}>
              <span>Sign</span>
              <div className="loader"></div>
            </button>
          </div>
        <EducationalText/>
      </main>
    </>
  );
}