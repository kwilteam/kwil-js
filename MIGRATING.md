# Migrating from Kwil SDK v3

Below is a list of all key changes from the [Kwil v3 SDK](https://www.npmjs.com/package/kwil).

Note that this SDK must be used with a Kwil Daemon that is running the CometBFT Release (Kwil Daemon v0.6.0+). If you are not using the CometBFT Release, please use [Kwil v3](https://www.npmjs.com/package/kwil).

## Breaking Changes

### Wallet Address Identifiers -> Public Keys

Because the newest version of Kwil suports both Secp256k1 Signatures and ED25519 Signatures, accounts and databases are now associated with public keys, not just ethereum wallet address.

#### Old Version

```javascript
const dbid = kwil.generateDBID('0x_walletaddress', 'dbName')
```

#### New version

```javascript
const dbid = kwil.generateDBID('public_key', 'dbName')
```

Note that an Ethereum wallet address is not a a Secp256k1 Public Key. To recover a Secp256k1 public key from an Ethereum signer, you can use the following helper method. You can optionally customize the message that the user signs when recovering the public key:

```javascript
import { Utils } from '@kwilteam/kwil-js'
import { BrowserProvider } from 'ethers'

const provider = new BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

const publicKey = await Utils.recoverSecp256k1PubKey(signer, 'Welcome to our app! Sign this message to reveal your public key.');
```

### Get Account Identified by Public Key, Public Keys Returned as Bytes

In the old version, accounts were identified by Ethereum Wallets. Now, they are identified by public keys (Secp256k1 or ED25519). Public keys can be represented by a Hex string or bytes (Uint8Array). If using a NEAR public key, you may also pass the Base58 encoded public key with the "ed25519:" prefix.

When returned from the server, public keys will always be represented as a Uint8Array.

#### Old Version

```javascript
const res = await kwil.getAccount('wallet_address');

/*
    res.data = {
        address: '0x..',
        balance: '###',
        nonce: '###'
    }
*/
```

#### New Version

```javascript
const res = await kwil.getAccount('public_key');

/*
    res.data = {
        public_key: Uint8Array(),
        balance: '###',
        nonce: '###'
    }
*/

```

### Executing Actions + Friendly Signature Messages

The previous version of Kwil used an `ActionBuilder()` class to build and sign transactions. `ActionBuilder()` has been moved internally. Actions can now be executed by using the `kwil.execute()` method, passing an object that matches the `ActionBody` interface and a [KwilSigner](#kwil-signer-class--ed25519-signatures) (see more below).

You can also customize the signature message that appears in metamask by adding a `decscription` field to the action body.

#### Old Version

```javascript
const tx = await kwil
    .actionBuilder()
    .dbid('some dbid')
    .name('action_name')
    .concat([ 'inputs', 'inputs' ])
    .signer(signer)
    .buildTx();
```

#### New Version

```javascript
const actionBody = {
    dbid: 'some dbid',
    action: 'action_name',
    inputs: [ 'inputs', 'inputs' ],
    description: 'Click sign to execute the action!'
}

const res = await kwil.execute(actionBody, kwilSigner);
```

### Data Returned From Broadcast

In the old version, the information returned from the broadcast endpoint would indicate whether a transaction was successful or not.

Now, a transaction must be mined on the Kwil chain before a user will know if it is successful. This means that the `.broadcast()` method will only return a `tx_hash`. You can check the status of the tx by calling `kwil.txInfo(tx_hash)`.

#### Old Version

```javascript
const res = await kwil.broadcast(tx);

/*
    res.data = {
        txHash: ...,
        fee: ...,
        body: ...
    }
*/
```

#### New Version

```javascript
const res = await kwil.broadcast(tx);

/*
    res.data = {
        tx_hash: ...,
    }
*/
```



### Snake case for data returned from server

In the old version, there were case inconsistencies in data that was returned from the kwil network. Some data was in camel case, whereas other was in snake case. Now, all data is returned with snake case.

## New Features

### Kwil Signer Class & ED25519 Signatures

In the old version, the Kwil SDK used EtherJS signers for signing transactions. Now, the Kwil SDK uses a `KwilSigner` class, which can be used to sign transactions with multiple signature types.

The `KwilSigner` still natively supports `EthersJS` signers. You can also pass a signing callback function (see below) and specifiyng the signature type.

```javascript
import { Utils, KwilSigner } from '@kwilteam/kwil-js';
import { BrowserProvider } from 'ethers';

// get ethers signer
const provider = new BrowserProvider(window.ethereum)
const signer = await provider.getSigner();

// get secp256k1 public key
const publicKey = await Utils.recoverSecp256k1PubKey(signer);

// create kwil signer
const kwilSigner = new KwilSigner(signer, publicKey);

```

If you wish to sign with something other than an EtherJS signer, you may pass a callback function that accepts and returns a `Uint8Array()` and the enumerator for the signature type used.

Currently, Kwil supports two signature types:
| Type  | Enumerator |
|:----- |:------:|
| Secp256k1  | 'secp256k1_ep'     |
| Ed25519    | 'ed25519'     |

To use an ed25519 signature:

```javascript
import nacl from 'tweetnacl';
import { KwilSigner } from '@kwilteam/kwil-js';

// create keypair and signer
const keys = nacl.sign.keyPair();
const customSigner = (msg) => nacl.sign.detached(msg, keys.secretKey);

const kwilSigner = new KwilSigner(customSigner, keys.publicKey, 'ed25519');
```

### Read-Only Actions / Messages

Any action with `mutability` set to `view` should be called by passing an `ActionBody` object to the `kwil.call()` method.

You can check if an action is a `view` action by calling `kwil.getSchema()`.

Note that view actions should be read-only. The advantage to using `view` actions is that you do not have to wait for a transaction to be mined on the network; you can view the result of your read-only query instantly.

```javascript
const actionBody = {
    dbid: 'some_dbid',
    action: 'action_name',
    inputs: [ 'inputs', 'inputs' ]
}

const res = await kwil.call(actionBody);

/*
    res.data = {
        result: [ 'record 1', 'record 2, ... ]
    }
*/
```

If a `view` action has a `mustsign` auxiliary, you can also pass a `KwilSigner` as a second argument to the `kwil.call()` method.

### TxInfo Endpoint

After broadcasting a transaction, you can check its status (success, failure, blockheight, etc) by calling the `kwil.txInfo()` method.

```javascript
const res = await kwil.txInfo('tx_hash')

/*
    res.data = {
        hash: 'tx_hash',
        height: 'block height of tx on kwil chain'
        tx: Transaction (i.e. the transaction that was sent)
        tx_result: TxResult (gas fee, success message, failure message, etc.)
    }
*/
```

If you have any questions on this migration, please reach out to luke@kwil.com.
