const kwiljs = require("../dist/index")
const ethers = require("ethers")
const testDB = require("./test_schema.json")
require("dotenv").config()

async function test() {
    //update to goerli when live
    const provider = new ethers.providers.JsonRpcProvider("http://localhost:64960")
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider)

    const kwil = new kwiljs.NodeKwil({
        kwilProvider: "http://localhost:64966",
        timeout: 10000,
        logging: true,
    })

    const signer = wallet

    // broadcast(kwil, testDB, wallet)
    // getSchema(kwil, wallet.address, "testdb")
    // getAccount(kwil, wallet.address)
    // listDatabases(kwil, wallet.address)
    // ping(kwil)
    // getFunder(kwil, wallet)
    // getAllowance(kwil, wallet)
    // getBalance(kwil, wallet)
    // approve(kwil, wallet, 50000)
    // deposit(kwil, wallet, 25000)
    // getDepositedBalance(kwil, wallet)
    // getTokenAddress(kwil, wallet)
    // getAction(kwil, "x04fa403431edab4f2933cb249c365f02cfd11ad7783fb52028fff45a", "create_post")
    // newAction(kwil, "x04fa403431edab4f2933cb249c365f02cfd11ad7783fb52028fff45a", "create_user", wallet)
    // select(kwil, "x04fa403431edab4f2933cb249c365f02cfd11ad7783fb52028fff45a", "SELECT * FROM users")
    // bulkAction(kwil, "x04fa403431edab4f2933cb249c365f02cfd11ad7783fb52028fff45a", "create_user", wallet)
}

test()

async function getSchema(kwil, owner, n) {
    const schema = await kwil.getSchema(owner, n)
    console.log(schema.data.actions)
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
    let act1 = newAct.newAction()
    act1.set("$id", 7)
    act1.set("$username", "Hello World")
    act1.set("$age", 1)
    let act2 = newAct.newAction()
    act2.set("$id", 8)
    act2.set("$username", "Hello World 2")
    act2.set("$age", 2)

    if(!newAct.isComplete()) {
        throw new Error("Action is not complete")
    }

    const res = await newAct.prepareAction(w)
    const res2 = await kwil.broadcast(res)

    console.log(res2)
}

async function select(kwil, dbid, query) {
    const res = await kwil.selectQuery(dbid, query)
    console.log(res)
}

const bulkActions = [
    {
        "$id": 9,
        "$username": "Hello World 3",
        "$age": 1
    },
    {
        "$id": 10,
        "$username": "Hello World 4",
        "$age": 2
    },
    {
        "$id": 11,
        "$username": "Hello World 5",
        "$age": 3
    },
    {
        "$id": 12,
        "$username": "Hello World 6",
        "$age": 4
    }
]

async function bulkAction(kwil, dbid, action, w) {
    let newAct = await kwil.getAction(dbid, action)
    newAct.bulkAction(bulkActions)
    const tx = await newAct.prepareAction(w)
    const res = await kwil.broadcast(tx)
    console.log(res)
}