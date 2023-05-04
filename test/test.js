const kwiljs = require("../dist/index")
const ethers = require("ethers")
const testDB = require("./test_schema.json")
require("dotenv").config()

async function test() {
    //update to goerli when live
    const provider = new ethers.JsonRpcProvider(process.env.ETH_PROVIDER)
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider)

    const kwil = new kwiljs.NodeKwil({
        kwilProvider: "https://provider.kwil.com",
        timeout: 10000,
        logging: true,
    })

    const dbid = kwil.getDBID(wallet.address, "mydb")
    const dbid2 = kwil.getDBID(wallet.address, "ecclesia")
    // console.log(dbid)
    // broadcast(kwil, testDB, wallet)
    // await getSchema(kwil, dbid)
    // await getSchema(kwil, dbid)
    // await getSchema(kwil, dbid2)
    // getAccount(kwil, wallet.address)
    // listDatabases(kwil, wallet.address)
    // ping(kwil)
    // getFunder(kwil, wallet)
    // getAllowance(kwil, wallet)
    // getBalance(kwil, wallet)
    // approve(kwil, wallet, BigInt("100005"))
    // deposit(kwil, wallet, BigInt("100005"))
    // getDepositedBalance(kwil, wallet)
    // getTokenAddress(kwil, wallet)
    // await getAction(kwil, dbid, "add_post")
    // await getAction(kwil, dbid, "add_post")
    // await getAction(kwil, dbid, "delete_post")
    // await newAction(kwil, dbid, "add_post", wallet)
    select(kwil, dbid, "SELECT * FROM posts")
    // bulkAction(kwil, dbid, "add_post", wallet)
    // getSelectAction(kwil, dbid, "list_users", wallet)
}

test()

async function getSchema(kwil, d) {
    const schema = await kwil.getSchema(d)
    console.log(schema.data)
}

async function getAccount(kwil, owner) {
    const account = await kwil.getAccount(owner)
    console.log(account)
}

async function newTx(kwil, tx) {
    const txHash = await kwil.newDatabase(tx)
    return txHash
}

async function prepareTx(kwil, tx, sig) {
    const readytx = await newTx(kwil, tx)
    const txHash = await readytx.prepareJson(sig)
    return txHash
}

async function broadcast(kwil, tx, sig) {
    const readytx = await prepareTx(kwil, tx, sig)
    const txHash = await kwil.broadcast(readytx)
    console.log(txHash)
}

async function listDatabases(kwil, owner) {
    const databases = await kwil.listDatabases(owner)
    console.log(databases)
}

async function ping(kwil) {
    const ping = await kwil.ping()
    console.log(ping)
}

async function getFunder(kwil, w) {
    const funder = await kwil.getFunder(w)
    console.log(funder)
}

async function getAllowance(kwil, w) {
    const funder = await kwil.getFunder(w)
    const allowance = await funder.getAllowance(w.address)
    console.log(allowance)
}

async function getBalance(kwil, w) {
    const funder = await kwil.getFunder(w)
    const balance = await funder.getBalance(w.address)
    console.log(balance)
}

async function approve(kwil, w, amount) {
    const funder = await kwil.getFunder(w)
    const tx = await funder.approve(amount)
    console.log(tx)
}

async function deposit(kwil, w, amount) {
    const funder = await kwil.getFunder(w)
    const tx = await funder.deposit(amount)
    console.log(tx)
}

async function getDepositedBalance(kwil, w) {
    const funder = await kwil.getFunder(w)
    const balance = await funder.getDepositedBalance(w.address)
    console.log(balance)
}

async function getTokenAddress(kwil, w) {
    const funder = await kwil.getFunder(w)
    const tokenAddress = await funder.getTokenAddress()
    console.log(tokenAddress)
}

async function getAction(kwil, dbid, action) {
    const res = await kwil.getAction(dbid, action)
    console.log(res)
}

async function newAction(kwil, dbid, action, w) {
    const newAct = await kwil.getAction(dbid, action)
    let act1 = newAct.newInstance()
    act1.set("$id", 1)
    act1.set("$user", "Luke")
    act1.set("$title", "Hello")
    act1.set("$body", "This is a test post")
    let act2 = newAct.newInstance()
    act2.set("$id", 2)
    act2.set("$user", "Luke")
    act2.set("$title", "Hello")
    act2.set("$body", "This is a test post")

    if(!newAct.isComplete()) {
        throw new Error("Action is not complete")
    }

    const res = await newAct.prepareAction(w)
    const res2 = await kwil.broadcast(res)

    console.log(res2)
}

async function getSelectAction(kwil, dbid, selectAction, wallet) {
    let action = await kwil.getAction(dbid, selectAction)
    let act1 = action.newInstance()
    // act1.set("$address", wallet.address)
    const tx= await action.prepareAction(wallet)
    const res = await kwil.broadcast(tx)
    console.log(res)
}

async function select(kwil, dbid, query) {
    const res = await kwil.selectQuery(dbid, query)
    console.log(res)
}

const bulkActions = [
    {
        "$id": 105,
        "$user": "Luke",
        "$title": "Hello",
        "$body": "Hello World",
    },
    {
        "$id": 106,
        "$user": "Luke",
        "$title": "Hello",
        "$body": "Hello World 2",
    },
    {
        "$id": 107,
        "$user": "Luke",
        "$title": "Hello",
        "$body": "Hello World 3",
    },
    {
        "$id": 108,
        "$user": "Luke",
        "$title": "Hello",
        "$body": "Hello World 4",
    }
]

async function bulkAction(kwil, dbid, action, w) {
    let newAct = await kwil.getAction(dbid, action)
    newAct.bulk(bulkActions)
    const tx = await newAct.prepareAction(w)
    const res = await kwil.broadcast(tx)
    console.log(res)
}