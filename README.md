# Kwil-JS

Kwil-JS is a JavaScript/Typescript SDK for building browser and NodeJS applications to interact with the Kwil network.

## Installation

```bash
npm i @kwilteam/kwil-js
```

## Initialization

### Web

```javascript
import { BrowserProvider } from 'ethers';
import { WebKwil } from '@kwilteam/kwil-js';

// to be used for funding and signing transactions
const provider = new BrowserProvider(window.ethereum)

const kwil = new WebKwil({
    kwilProvider: "kwil_provider_endpoint"
});
```

### NodeJS

```javascript
const { Wallet } = require('ethers');
const kwiljs = require('@kwilteam/kwil-js');

// to be used for signing transactions
// instead of a provider, nodeJS requires a wallet
const wallet = new Wallet("my_ethereum_private_key")

const kwil = new kwiljs.NodeKwil({
    kwilProvider: "kwil_provider_endpoint",
});
```

## Identifiers

### Public Keys

In Kwil, accounts are identified by a public key. Kwil supports Secp256k1 Public Keys (e.g. EVM networks such as Ethereum) and ED25519 Public Keys (e.g Near Protocol).

Note that a Secp256k1 public key is different than an Ethereum address. You can use a utility function to recover the public key for an Ethereum Signer. You can optionally customize the signing message for the public key recovery.

```javascript
import { Utils } from '@kwilteam/kwil-js'

const signer = await provider.getSigner(); // can use wallet if NodeJS
const publicKey = await Utils.recoverSecp256k1PubKey(signer, 'Welcome to our app! Sign this message to reveal your public key.'); 
```

### Database Identifiers (DBID)

In Kwil, databases are identified by a 'database identifier', which is a hex encoded SHA224 Hash of the database name and public key, prepended with an `x`.

The public key can be passed as a hex-encoded string, or as Bytes (Uint8Array).

To get the DBID for a public key and database name, you can use the following helper method:

```javascript
const dbid = kwil.getDBID('public_key', 'database_name')
```

## Database Info

### Listing Databases

With the initialized Kwil object (either WebKwil or NodeKwil), you can query the Kwil provider for information about the network.

To list the databases that belong to a public key:

``` javascript
const res = await kwil.listDatabases("public_key")
// res.data = ["db1", "db2", "db3"]
```

### Get Schema

You can retrieve database information by calling `.getSchema()` and passing the dbid. Note that the database owner is returned as a Uint8Array.

``` javascript
const dbid = kwil.getDBID("public_key", "database_name")
const schema = await kwil.getSchema(dbid)

/*
    schema.data = {
        owner: Uint8Array,
        name: "database_name",
        tables: [ tableObject1, tableObject2, tableObject3 ],
        actions: [ action1, action2, action3 ],
        extensions: [ extension1, extension2 ]
    }
*/
```

### Get Account

You can get the remaining balance of an account and the account's nonce by using the `.getAccount()` method. `.getAccount()` takes a public key, either in hex format or bytes (Uint8Array).

``` javascript
const res = await kwil.getAccount("public_key")

/*
    res.data = {
        address: "public_key",
        balance: "some_balance",
        nonce: "some_nonce"
    }
*/
```

## Database Queries

### Create, Update, Delete (CUD) Actions

Any action that executes a CUD operation must be signed and broadcasted to the network as a transaction.

The public key can be passed as a hex string or as bytes. You can also customize the signature message that the user will see with the `.description()` method.

Out of the box, kwil-js supports signers from [EthersJS](https://github.com/ethers-io/ethers.js) (v5 and v6). You can also pass a signing callback function (see below).

``` javascript
import { Utils } from '@kwilteam/kwil-js'

// begin constructing the values for the action
const input = new Utils.ActionInput()
    .put("input_name_1", "input_value_1")
    .put("input_name_2", "input_value_2")
    .put("input_name_3", "input_value_3")

// retrieve database ID to locate action
const dbid = kwil.getDBID("publicKey", "database_name")

// construct and sign action transaction
const tx = await kwil
    .actionBuilder()
    .dbid(dbid)
    .name("your_action_name")
    .concat(input)
    .publicKey('public_key') // Can be a hex-encoded public key, or bytes.
    .signer(await provider.getSigner()) // can use wallet if NodeJS
    .description("Click sign to execute the action!") // your custom signature message
    .buildTx()

// broadcast transaction to kwil network
const res = await kwil.broadcast(tx)

/*
    res.data = {
        tx_hash: "0xhash",
    }
*/
```

#### Custom Signers

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

To sign with a NEAR Protocol Signer from [`near-api-js`](https://github.com/near/near-api-js):

```javascript
import { keyStores, InMemorySigner } from 'near-api-js';

const keyStore = new keyStores.BrowserLocalStorageKeyStore(window.localStorage);
const nearSigner = new InMemorySigner(keyStore)
const customSigner = async (msg) => {
    return (await nearSigner.signMessage(msg, 'accountId', 'networkId')).signature;
}

const tx = await kwil
    .actionBuilder()
    .dbid(dbid)
    .name("your_action_name")
    .concat(input)
    .publicKey('near_public_key')
    .signer(customSigner, 'ed25519_nr')
    .description("Click sign to execute the action!")
    .buildTx()

await kwil.broadcast(tx);
```

### Reading Data

To read data on Kwil, you can (1) execute a `view` action message or (2) query with the `.selectQuery()` method.

#### `View` Action Message

`View` actions are read-only actions that can be used to query data without having to wait for a transaction to be mined on Kwil.

To execute a `view` action, use the `actionBuilder` to build a message and pass it to the `kwil.call()` method.

```javascript
import { Utils } from '@kwilteam/kwil-js'

// begin constructing the values for the action
const input = new Utils.ActionInput()
    .put("input_name_1", "input_value_1")
    .put("input_name_2", "input_value_2")
    .put("input_name_3", "input_value_3")

// retrieve database ID to locate action
const dbid = kwil.getDBID("public_key", "database_name")

// construct and sign action transaction
const msg = await kwil
    .actionBuilder()
    .dbid(dbid)
    .name("your_action_name")
    .concat(input)
    .buildMsg()

// broadcast transaction to kwil network
const res = await kwil.call(msg)

/*
    res.data = {
        result: [ query results ],
    }
*/

```

`View` actions may also require a signer, depending on if the original actions were deployed with a `must_sign` attribute. You can check if an action requires a signature by calling `kwil.getSchema()`.

If an action requires a signature, you should chain `.publicKey()` and `.signer()` methods before building. You can also customize the message with the `.description()` method.

If you are using an ED25519 signer, you should also chain a `.nearConfig()` method.

#### Select Query

You may also query any of the database data by calling the `kwil.selectQuery()` method. Note that this can only be used for read-only queries

``` javascript
const dbid = kwil.getDBID("public_key", "database_name")
const res = await kwil.selectQuery(dbid, "SELECT * FROM users")

/*
    res.data = [
        ...
    ]
*/
```

### Database Building

Although you can deploy new databases with the JS-SDK, we strongly recommend using the Kwil [Kuneiform IDE](https://ide.kwil.com) to manage the entire database deployment process.

To deploy a new database, first define your syntax in the Kuneiform IDE. You can learn more about the syntax rules [here](https://docs.kwil.com/intro-to-kwil/welcome-to-kwil).

Once the syntax is ready, click "Compile". Right click your compiled files and click "Export to JSON".

Import your JSON to your Javascript project.

``` javascript
// import and call database JSON
import myDB from "./myDB.json";

// prepare new database tx
const tx = await kwil
    .dbBuilder()
    .payload(myDB)
    .publicKey('public_key') // Can be a hex-encoded public key, or bytes.
    .signer(await provider.getSigner()) // can use Wallet for NodeJS
    .description("Sign to deploy your database") // custom message
    .buildTx();

// broadcast transaction
const res = await kwil.broadcast(tx);

/*
    res = {
        status: 200,
        data: {
            tx_hash: "0xsome_hash",
            fee: "fee_amount"
        }
    }
*/
```
