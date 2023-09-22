# Migrating from Kwil SDK v3

Below is a list of all key changes from the [Kwil v3 SDK](https://www.npmjs.com/package/kwil).

Note that this SDK must be used with a Kwil Daemon that is running the CometBFT Release (September 2023). If you are not using the CometBFT Release, please use [Kwil v3](https://www.npmjs.com/package/kwil).

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

### ActionBuilder and DBBuilder

The ActionBuilder and DBBuilder classes now require you to chain a `.publicKey()` method to the builder. The `.publicKey()` can receive a hex string or Uint8Array. If using a NEAR public key, you may also pass the Base58 encoded public key with the "ed25519:" prefix.

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
const tx = await kwil
    .actionBuilder()
    .dbid('some dbid')
    .name('action_name')
    .concat([ 'inputs', 'inputs' ])
    .publicKey('signer_public_key') // new method
    .signer(signer)
    .buildTx();
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

### ED25519 & Custom Signers

This version introduces support for ed25519 signatures.

If you wish to sign with something other than an EtherJS signer, you may pass a callback function that returns a `Uint8Array()` and the enumerator for the signature type used.

Currently, Kwil supports three signature types:
| Type  | Enumerator |
|:----- |:------:|
| Secp256k1  | 'secp256k1_ep'     |
| Ed25519    | 'ed25519'     |
| Ed25519 w/ NEAR Digest | 'ed25519_nr' |

To sign with a ed25519 signature:

```javascript
import nacl from 'tweetnacl';

const keys = nacl.sign.keyPair();
const customSigner = (msg) => nacl.sign.detached(msg, keys.secretKey);

const tx = await kwil
    .actionBuilder()
    .dbid(dbid)
    .name('your_action_name')
    .concat(input)
    .publicKey(keys.publicKey)
    .signer(customSigner, 'ed25519')
    .buildTx()

await kwil.broadcast(tx);
```

### Read-Only Actions / Messages

Any action with `mutability` set to `view` should be called by building a message and passing the message to `kwil.call()`.

You can check if an action is a `view` action by calling `kwil.getSchema()`.

Note that view actions should be read-only. The advantage to using `view` actions is that you do not have to wait for a transaction to be mined on the network; you can view the result of your read-only query instantly.

```javascript
const msg = await kwil
    .actionBuilder()
    .dbid('some_dbid')
    .name('action_name')
    .concat('ActionInput...')
    .buildMsg();

const res = await kwil.call(msg);

/*
    res.data = {
        result: [ 'record 1', 'record 2, ... ]
    }
*/
```

If a `view` action has a `must_sign` auxiliary, you should also chain `.signer()` and `.publicKey()` methods to the builder.

If you are using a NEAR signer, you must also chain the `.nearConfig()` method.

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
