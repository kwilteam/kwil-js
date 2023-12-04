# Kwil-JS

Kwil-JS is a JavaScript/Typescript SDK for building browser and NodeJS applications to interact with Kwil networks.

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
    kwilProvider: "kwil_provider_endpoint",
    chainId: "your_kwil_chain_id"
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
    chainId: "your_kwil_chain_id"
});
```

## Identifiers

### Account Identifiers

In Kwil, accounts are identified by the signer(s) that are used on the Kwil Network. Kwil natively supports two types of signers: Secp256k1 (EVM) and ED25519.

Secp256k1 signers use **Ethereum wallet addresses** as identifiers. ED25519 signers use the **ED25519 public key** as identifiers.

### Database Identifiers (DBID)

In Kwil, databases are identified by a 'database identifier' (sometime referred to as DBID), which is a hex encoded SHA224 Hash of the database name and public key, prepended with an `x`.

The account identifier can be passed as a hex-encoded string, or as Bytes (Uint8Array).

To get the DBID for an account identifier and database name, you can use the following helper method:

```javascript
import { Utils } from "@kwilteam/kwil-js";

const dbid = Utils.generateDBID('account_identifier', 'database_name')
```

## Signers

Certain operations in Kwil require signature authentication from the user (e.g. deploy database, drop database, execute CRUD actions, etc).

To manage signing, Kwil-JS uses a `KwilSigner` class. Out of the box, Kwil-JS supports signers from [EthersJS](https://github.com/ethers-io/ethers.js) (v5 and v6). You can also pass a signing callback function (see below).

The account identifier can be passed as a hex string or as bytes.

```javascript
import { Utils, KwilSigner } from '@kwilteam/kwil-js';
import { BrowserProvider } from 'ethers';

// get ethers signer
const provider = new BrowserProvider(window.ethereum)
const signer = await provider.getSigner();

// get ethereum address
const identifier = await signer.getAddress();

// create kwil signer
const kwilSigner = new KwilSigner(signer, identifier);

```

### Custom Signers

If you wish to sign with something other than an EtherJS signer, you may pass a callback function that accepts and returns a `Uint8Array()` and the enumerator for the signature type used.

Currently, Kwil supports two signature types:

| Type      |   Enumerator   |   Identifier   | Description |
| :-------- | :------------: | ----------- | ----------- |
| Secp256k1 | 'secp256k1_ep' | Ethereum Wallet Address | The Kwil Signer will use a secp256k1 elliptic curve signature. |
| ED25519   |   'ed25519'    | ED25519 Public Key | The Kwil Signer will use an ED25519 signature. |

To use an ED25519 signature:

```javascript
import nacl from 'tweetnacl';
import { KwilSigner } from '@kwilteam/kwil-js';

// create keypair and signer
const keys = nacl.sign.keyPair();
const customSigner = (msg) => nacl.sign.detached(msg, keys.secretKey);
const identifier = keys.publicKey;

const kwilSigner = new KwilSigner(customSigner, identifier, 'ed25519');
```

## Database Queries

### Create, Update, Delete (CUD) Actions

Any action that executes a CUD operation must be signed and broadcasted to the network through the `kwil.execute()` method.

`.execute()` takes an object that matches the `ActionBody` interface. Action body has two required fields: `dbid` and `action`. You can also optionally add an `inputs` field if the action requires inputs, and a `description` field to customize the signature message.

``` javascript
import { Utils } from '@kwilteam/kwil-js'

// begin constructing the values for the action
const input = new Utils.ActionInput()
    .put("input_name_1", "input_value_1")
    .put("input_name_2", "input_value_2")
    .put("input_name_3", "input_value_3")

// get database ID
const dbid = kwil.getDBID("account_identifier", "database_name")

const actionBody = {
    dbid,
    action: "your_action_name",
    inputs: [ input ],
    description: "Click sign to execute the action!"
}

// pass action body and signer to execute method
const res = await kwil.execute(actionBody, kwilSigner)

/*
    res.data = {
        tx_hash: "hash",
    }
*/
```

### Reading Data

To read data on Kwil, you can (1) call a `view` action or (2) query with the `.selectQuery()` method.

#### `View` Action Message

`View` actions are read-only actions that can be used to query data without having to wait for a transaction to be mined on Kwil.

Only one `input` is allowed for `view` actions.

To execute a `view` action, pass an `ActionBody` object to the `kwil.call()` method.

```javascript
import { Utils } from '@kwilteam/kwil-js'

// begin constructing the values for the action
const input = new Utils.ActionInput()
    .put("input_name_1", "input_value_1")
    .put("input_name_2", "input_value_2")
    .put("input_name_3", "input_value_3")

// retrieve database ID to locate action
const dbid = kwil.getDBID("account_identifier", "database_name")

const actionBody = {
    dbid,
    action: "your_action_name",
    inputs: [ input ]
}

// pass action body to execute method
const res = await kwil.call(actionBody)

/*
    res.data = {
        result: [ query results ],
    }
*/

```

If the view action uses a `@caller` contextual variable, you should also pass the `kwilSigner` to the `kwil.call()` method. This will allow the view action to access the caller's account identifier. Note that the user does not need to sign for view actions.

```javascript
await kwil.call(actionBody, kwilSigner)
```

#### Select Query

You may also query any of the database data by calling the `kwil.selectQuery()` method. Note that this can only be used for read-only queries

``` javascript
const dbid = kwil.getDBID("account_identifier", "database_name")
const res = await kwil.selectQuery(dbid, "SELECT * FROM users")

/*
    res.data = [
        ...
    ]
*/
```

## Network Info

### ChainID and Status

To verify that you are using the correct `chainId`, as well as the latest block height and block hash on your chain, you can call the `.chainInfo()` method.

``` javascript
const res = await kwil.chainInfo()

/*
    res.data = {
        chain_id: "your_chain_id",
        height: "latest_block_height",
        hash: "latest_block_hash"
    }
*/
```

### List Databases

To list the databases that belong to a user:

``` javascript
const res = await kwil.listDatabases("account_identifier")
// res.data = ["db1", "db2", "db3"]
```

### Get Schema

You can retrieve database information by calling `.getSchema()` and passing the dbid. Note that the database owner is returned as a Uint8Array.

``` javascript
const dbid = kwil.getDBID("owner_wallet_address", "database_name")
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

You can get the remaining balance of an account and the account's nonce by using the `.getAccount()` method. `.getAccount()` takes an account identifier, either in hex format or bytes (Uint8Array).

``` javascript
const res = await kwil.getAccount("account_identifier")

/*
    res.data = {
        identifier: Uint8Array,
        balance: "some_balance",
        nonce: "some_nonce"
    }
*/
```

## Kwil Gateway Authentication

Kwil Gateway is an optional service on Kwil networks that allows for authenticating users with their signatures for read queries. If your Kwil network used a Kwil Gateway, you can use the `kwil.authenticate()` method to authenticate users. Note the additional step of passing the cookie back to the kwil class in NodeJS.

### Web

```javascript
// pass the kwilSigner to the authenticate method
const res = await kwil.authenticate(kwilSigner);

/*
    res = {
        status: 200,
        data: {
            result: "success"
        }
    }
*/
```

### NodeJS

``` javascript
// pass the kwilSigner to the authenticate method
const res = await kwil.authenticate(kwilSigner);

/*
    res = {
        status: 200,
        data: {
            result: "success",
            cookie: "some_cookie"
        },
        
    }
*/

// pass the cookie to the kwil class
kwil.setCookie(res.data.cookie)
```

## Database Building

Although you can deploy new databases with the JS-SDK, we strongly recommend using the Kwil [Kuneiform IDE](https://ide.kwil.com) or [Kwil CLI](https://github.com/kwilteam/binary-releases/releases) to manage the entire database deployment process.

To deploy a new database, first define your syntax in the Kuneiform IDE. You can learn more about the syntax rules [here](https://docs.kwil.com/intro-to-kwil/welcome-to-kwil).

Once the syntax is ready, click "Compile". Right click your compiled files and click "Export to JSON".

Import your JSON to your Javascript project.

``` javascript
// import and call database JSON
import myDB from "./myDB.json";

// construct DeloyBody object
const deployBody = {
    schema: myDB,
    description: "Sign to deploy your database"
}

// send to kwil.deploy()
const res = await kwil.deploy(deployBody, kwilSigner);

/*
    res = {
        status: 200,
        data: {
            tx_hash: "some_hash"
        }
    }
*/
```

## Kwil Gateway Authentication

Kwil Gateway is an optional service on Kwil networks that allows for authenticating users with their signatures for read queries. If your Kwil network used a Kwil Gateway, you can use the `kwil.authenticate()` method to authenticate users. Note the additional step of passing the cookie back to the kwil class in NodeJS.

### Web

``` javascript
// pass the kwilSigner to the authenticate method
const res = await kwil.authenticate(kwilSigner);

/*
    res = {
        status: 200,
        data: {
            result: "success"
        }
    }
*/
```

### NodeJS

``` javascript
// pass the kwilSigner to the authenticate method
const res = await kwil.authenticate(kwilSigner);

/*
    res = {
        status: 200,
        data: {
            result: "success",
            cookie: "some_cookie"
        },
        
    }
*/

// pass the cookie to the kwil class
kwil.setCookie(res.data.cookie)
```
