# Kwil-JS

Kwil-JS is a JavaScript/Typescript SDK for building web applications to interact with the Kwil network.
## Installation
```
npm i kwil
```

## Initialization
### Web
```javascript
import { ethers } from 'ethers';
import { WebKwil } from 'kwil';

// to be used for funding and signing transactions
const provider = new ethers.providers.BrowserProvider(window.ethereum)

const kwil = new WebKwil({
    kwilProvider: "kwil_provider_endpoint"
});
```

### NodeJS
```javascript
const { ethers } = require('ethers');
const kwiljs = require('kwil');

// to be used for funding and signing transactions
// instead of a provider, nodeJS requires a wallet
const wallet = new ethers.Wallet("my_ethereum_private_key")

const kwil = new kwiljs.NodeKwil({
    kwilProvider: "kwil_provider_endpoint",
});
```

## Usage
### Listing Databases
With the initialized Kwil object (either WebKwil or NodeKwil), you can query the Kwil provider for information about the network.

To list the databases that belong to a wallet address:
``` javascript
const res = await kwil.listDatabases("owner_address")
// res.data = ["db1", "db2", "db3"]
```
### Get Schema
You can retrieve database information by calling .getSchema and passing the dbid.

``` javascript
const dbid = kwil.getDBID("0xOwner_address", "database_name")
const schema = await kwil.getSchema(dbid)

/*
    schema.data = {
        owner: "0xowner_address",
        name: "database_name",
        tables: [ tableObject1, tableObject2, tableObject3 ],
        actions: [ action1, action2, action3 ]
    }
*/
```
### Executing Actions
You can chain action methods execute insert/update/delete/read operations on a database.
``` javascript
import {Utils} from "kwil"

// begin constructing the values for the action
const input = new Utils.ActionInput()
    .put("input_name_1", "input_value_1")
    .put("input_name_2", "input_value_2")
    .put("input_name_3", "input_value_3")

// retrieve database ID to locate action
const dbid = kwil.getDBID("0xOwner_address", "database_name")

// construct and sign action transaction
const tx = await kwil
    .actionBuilder()
    .dbid(dbid)
    .name("your_action_name")
    .concat(input)
    .signer(await provider.getSigner()) // can use wallet if NodeJS
    .buildTx()

// broadcast transaction to kwil network
const res = await kwil.broadcast(actionTx)

/*
    res.data = {
        txHash: "0xhash",
        fee: "some_spent_fee",
        body: "data_if_relevant"
    }
*/
```
### Reading Data
In addition to reading data with actions, you can execute nearly any SELECT query on Kwil databases.
``` javascript
const dbid = kwil.getDBID("0xOwner_address", "database_name")
const res = await kwil.selectQuery(dbid, "SELECT * FROM users")

/*
    res.data = [
        ...
    ]
*/
```
### Reading Account Data
You can get the remaining balance of an account and the account's nonce by using the getAccount method.
``` javascript
const res = await kwil.getAccount("0xOwner_address")

/*
    res.data = {
        address: "0xOwner_address",
        balance: "some_balance_big_int",
        nonce: "some_nonce_integer"
    }
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
    .signer(await provider.getSigner()) // can use Wallet for NodeJS
    .buildTx();

// broadcast transaction
const res = await kwil.broadcast(tx);

/*
    res = {
        status: 200,
        data: {
            txHash: "0xsome_hash",
            fee: "fee_amount"
        }
    }
*/
```
### Funding
**Approving and deposit funds**
Currently, you can receive Kwil testnet funds from our [faucet](https://faucet.kwil.com/).

To approve and deposit funds to a Kwil funding pool:
``` javascript
// retrieve the allowance for an address
const currentAllowance = await kwil.funder.getAllowance("wallet_address")
// currentAllowance: { allowance_balance: 'some_balance'}

// retrieve the tokal amount of tokens deposited (used and unused)
const depositAmt = await kwil.funder.getDepositedBalance("wallet_address")
// depositAmt: { deposited_balance: 'some_balance'}

let res = await kwil.funder.approve(BigInt("1000000000000000000")) 
// 1 KWIL BETA TOKEN
/*
    res: { hash: '0x...'}
*/

res = await kwil.funder.deposit(BigInt("1000000000000000000")) 
// 1 KWIL BETA TOKEN
/*
    res: { hash: '0x...'}
*/


```
Kwil-JS also provides other utility functions for checking your token balance and usage:
``` javascript
// get the token address for the current pool
const token = await kwil.funder.getTokenAddress()
// token: "0xE596928C26A11e9373FC4245d6Ee02aE0De32612"

// get the token balance for a wallet's address
const balance = await kwil.funder.getBalance("0xAfFDC06cF34aFD7D5801A13d48C92AD39609901D")
// balance: BigNumber { _hex: '0x00', _isBigNumber: true }
```