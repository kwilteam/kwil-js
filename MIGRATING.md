# Kwil-JS Migration Guide

This document contains important information for migrating between Kwil-JS versions.

If you have any questions on a migration, please reach out to luke@kwil.com.

## Migrating from @kwilteam/kwil-js@0.6 to @kwilteam/kwil-js@0.7-beta.0

Below is a list of all key changes from the [Kwil v0.6 SDK](https://github.com/kwilteam/kwil-js/releases/tag/v0.6.3) to the v0.7-beta SDK.

Note that this SDK must be used with a Kwil Node v0.8.0 and above.

### Breaking Changes

#### JSON-RPC Endpoint in Kwil Constructor

The Kwil-JS SDK now relies on the JSON-RPC endpoint introduced in Kwil-DB v0.8. Previously, the SDK relied on the REST API endpoint. By default, the Kwil-DB JSON-RPC endpoint is available at `http://localhost:8484`.

##### Old Version

```javascript
const kwil = new WebKwil({
    kwilProvider: 'http://localhost:8080', // REST API endpoint
    chainId: 'your_chain_id'
});
```

##### New Version

```javascript
const kwil = new WebKwil({
    kwilProvider: 'http://localhost:8484', // JSON-RPC endpoint
    chainId: 'your_chain_id'
});
```

#### Kwil.execute() payload (`ActionBody`), requires `name` property instead of `action`.

In order to make the API clearer for executing both actions and procedures, the `action` property in the `ActionBody` object has been renamed to `name`. This change is to make it clear that the `name` property is used to specify the name of the action or procedure to be executed.

The `action` property is still supported for backwards compatibility. It will be removed in kwil-js v0.8.

##### Old Version

```javascript
await kwil.execute({
    dbid: 'some_dbid',
    action: 'action_name',
    inputs: [ 'inputs' ]
}, kwilSigner);
```

##### New Version

```javascript
await kwil.execute({
    dbid: 'some_dbid',
    name: 'action_or_procedure_name',
    inputs: [ 'inputs' ]
}, kwilSigner);
```

## Migrating from Kwil SDK v3 (old SDK) to @kwilteam/kwil-js v0.6

Below is a list of all key changes from the [Kwil v3 SDK / old Kwil SDK](https://www.npmjs.com/package/kwil).

Note that this SDK must be used with a Kwil Node v0.6.0 and above. If you are not using a Kwil Node on v0.6.0 or above, please use the [old Kwil SDK](https://www.npmjs.com/package/kwil).

### Breaking Changes

#### Chain ID Configuration

In order to prevent users from accidentally broadcasting transactions to the wrong Kwil chain, the Kwil chain ID must now be specified when initializing the Kwil object.

##### Old Version

```javascript
const kwil = new WebKwil({
    kwilProvider: 'https://some_kwil_kwil_provider',
});
```

##### New Version

```javascript
const kwil = new WebKwil({
    kwilProvider: 'https://some_kwil_kwil_provider',
    chainId: 'your_chain_id'
});
```

You can check the chain ID of your Kwil chain by calling `kwil.chainInfo()`.

```javascript
const res = await kwil.chainInfo()

/*
    res.data = {
        chain_id: "your_chain_id",
        height: "latest_block_height",
        hash: "latest_block_hash"
    }
*/
```

#### Account Identifiers Determined by Signers

In the old version, accounts were only identified by Ethereum Wallets. Now, Kwil Networks support pluggable authentication/signers, meaning that the signer determines the appropriate account identifier.

Out of the box, Kwil supports Secp256k1 (Ethereum) and Ed25519 signatures. Their corresponding identifiers are below:

| Type      |   Identifier   | Description |
| :-------- | :------------: | ----------- |
| Secp256k1 | Ethereum Wallet Address | The Kwil Signer will use a secp256k1 elliptic curve signature, which is the same signature used in Ethereum's [personal sign](https://eips.ethereum.org/EIPS/eip-191). |
| ED25519   | ED25519 Public Key | The Kwil Signer will use an ED25519 signature. |

When returned from the server, identifiers will always be represented as a Uint8Array.

##### Old Version

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

##### New Version

```javascript
const res = await kwil.getAccount('account_identifier');

/*
    res.data = {
        identifier: Uint8Array(),
        balance: '###',
        nonce: '###'
    }
*/

```

#### Executing Actions + Friendly Signature Messages

The previous version of Kwil used an `ActionBuilder()` class to build and sign transactions. `ActionBuilder()` has been moved internally. Actions can now be executed by using the `kwil.execute()` method, passing an object that matches the `ActionBody` interface and a [KwilSigner](#kwil-signer-class--ed25519-signatures) (see more below).

You can also customize the signature message that appears in MetaMask by adding a `decscription` field to the action body.

##### Old Version

```javascript
const tx = await kwil
    .actionBuilder()
    .dbid('some dbid')
    .name('action_name')
    .concat([ 'inputs', 'inputs' ])
    .signer(signer)
    .buildTx();
```

##### New Version

```javascript
const actionBody = {
    dbid: 'some dbid',
    action: 'action_name',
    inputs: [ 'inputs', 'inputs' ],
    description: 'Click sign to execute the action!'
}

const res = await kwil.execute(actionBody, kwilSigner);
```

#### Data Returned From Transactions

In the old version, the information returned from the broadcast endpoint would indicate whether a transaction was successful or not.

Now, a transaction must be mined on the Kwil chain before a user will know if it is successful. This means that the `.broadcast()` method will only return a `tx_hash`. You can check the status of the tx by calling `kwil.txInfo(tx_hash)`.

##### Old Version

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
##### New Version

```javascript
const res = await kwil.execute(actionBody, kwilSigner);

/*
    res.data = {
        tx_hash: ...,
    }
*/

const success = await kwil.txInfo(res.data?.tx_hash);

/*
    success.data = {
        hash: 'tx_hash',
        height: 'block height of tx on kwil chain'
        tx: Transaction (i.e. the transaction that was sent)
        tx_result: TxResult (gas fee, success message, failure message, etc.)
    }
*/
```

#### List Databases now returns array of `DatasetInfo` objects

In the old version, the `kwil.listDatabases()` method returned an array of database name strings. Now, the `kwil.listDatabases()` method returns an array of `DatasetInfo` objects, which contains the database name, database ID, and database owner.

Additionally, you can now leave the first parameter of `kwil.listDatabases()` empty to list all databases on the Kwil network.

##### Old Version

```javascript
const res = await kwil.listDatabases();

/*
    res.data = [ 'db1', 'db2', ... ]
*/
```

##### New Version

```javascript
const res = await kwil.listDatabases();

/*
    res.data = [
        {
            name: 'db1',
            id: 'db1_id',
            owner: Uint8Array()
        },
        {
            name: 'db2',
            id: 'db2_id',
            owner: Uint8Array()
        },
        ...
    ]
*/
```

#### Snake case for data returned from server

In the old version, there were case inconsistencies in data that was returned from the kwil network. Some data was in camel case, whereas other was in snake case. Now, all data is returned with snake case.

### New Features

#### Kwil Signer Class & ED25519 Signatures

In the old version, the Kwil SDK used EtherJS signers for signing transactions. Now, the Kwil SDK uses a `KwilSigner` class, which can be used to sign transactions with multiple signature types.

The `KwilSigner` still natively supports `EthersJS` signers. You can also pass a signing callback function (see below) and specifiyng the signature type.

```javascript
import { KwilSigner } from '@kwilteam/kwil-js';
import { BrowserProvider } from 'ethers';

// get ethers signer
const kwilProvider = new BrowserProvider(window.ethereum)
const signer = await kwilProvider.getSigner();

// get wallet address
const address = await signer.getAddress();

// create kwil signer
const kwilSigner = new KwilSigner(signer, address);

```

If you wish to sign with something other than an EtherJS signer, you may pass a callback function that accepts and returns a `Uint8Array()` and the enumerator for the signature type used.

Currently, Kwil supports two signature types:

| Type      |   Identifier   |   Enumerator   | Description |
| :-------- | :------------: | ----------- | ----------- |
| Secp256k1 | Ethereum Wallet Address | 'secp256k1_ep' | The Kwil Signer will use a secp256k1 elliptic curve signature, which is the same signature used in Ethereum's [personal sign](https://eips.ethereum.org/EIPS/eip-191). |
| ED25519   | ED25519 Public Key |   'ed25519'    | The Kwil Signer will use an ED25519 signature. |signature.   |

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

Note that view actions should be read-only, and only accept **one input**. The advantage to using `view` actions is that you do not have to wait for a transaction to be mined on the network; you can view the result of your read-only query instantly.

```javascript
const actionBody = {
    dbid: 'some_dbid',
    action: 'action_name',
    inputs: [ 'inputs' ]
}

const res = await kwil.call(actionBody);

/*
    res.data = {
        result: [ 'record 1', 'record 2, ... ]
    }
*/
```

If the view action uses a `@caller` contextual variable, you should also pass the `kwilSigner` to the `kwil.call()` method. This will allow the view action to access the caller's account identifier. Note that the user does not need to sign anything for view actions.

```javascript
await kwil.call(actionBody, kwilSigner)
```

#### TxInfo Endpoint

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
