import 'regenerator-runtime/runtime';
import React from 'react';
import mydb from './mydb.json';
import { WebKwil } from '../../dist';
import './assets/global.css';
import { EducationalText, SignInPrompt, SignOutButton } from './ui-components';

export default function App({ isSignedIn, contractId, wallet }) {
  const [valueFromBlockchain, setValueFromBlockchain] = React.useState();


  const [uiPleaseWait, setUiPleaseWait] = React.useState(true);


  const kwil = new WebKwil({
    kwilProvider: "http://localhost:8080",
    timeout: 10000,
    logging: true,
  });


  async function deployDatabase() {
    // const signer = await getKeyPair();
    console.log(wallet.accountId)

    const tx = await kwil
      .dbBuilder()
      .payload(mydb)
      .publicKey(wallet.accountId)
      .signer(wallet.wallet)
      .buildTx()

      console.log('TX', tx)

      const res = await kwil.broadcast(tx)
      console.log(res)
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