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
    // const dbid2 = kwil.getDBID(wallet.address, "selectaction")
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
    // approve(kwil, wallet, BigInt(10 * 10^18))
    // deposit(kwil, wallet, BigInt(10 * 10^18))
    // getDepositedBalance(kwil, wallet)
    // getTokenAddress(kwil, wallet)
    // await execSingleAction(kwil, dbid, "add_post", wallet)
    // select(kwil, dbid, "SELECT * FROM posts WHERE id > 100")
    // select(kwil, dbid, `WITH RECURSIVE 
    //                         cnt(x) AS (
    //                         SELECT 1
    //                         UNION ALL
    //                         SELECT x+1 FROM cnt
    //                         LIMIT (SELECT MAX(id) FROM posts)
    //                     )
    //                     SELECT x 
    //                     FROM cnt
    //                     WHERE x NOT IN (SELECT id FROM posts) AND x <= 135;
    //         `)
    // bulkAction(kwil, dbid, "add_post", wallet)
    // getSelectAction(kwil, dbid2, "get_items", wallet)
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

async function broadcast(kwil, tx, sig) {
    const readytx = await kwil
        .dbBuilder()
        .payload(tx)
        .signer(sig)
        .buildTx()
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

async function getAction(kwil) {
    const res = await kwil.actionBuilder()
    console.log(res)
}

async function execSingleAction(kwil, dbid, action, w) {
    const query = await kwil.selectQuery("xca20642aa31af7db6b43755cf40be91c51a157e447e6cc36c1d94f0a", "SELECT COUNT(*) FROM posts");

    const count = query.data[0][`COUNT(*)`]

    const Input = kwiljs.Utils.ActionInput

    const solo = Input.of()
        .put("$id", count + 1)
        .put("$user", "Luke")
        .put("$title", "Hello")
        .put("$body", "Hello World")

    let act = await kwil
        .actionBuilder()
        .dbid(dbid)
        .name(action)
        .concat(solo)
        .signer(w)
        .buildTx();

    const res = await kwil.broadcast(act)

    console.log(res)
}

async function getSelectAction(kwil, dbid, selectAction, wallet) {
    const tx = await kwil
        .actionBuilder()
        .dbid(dbid)
        .name(selectAction)
        .signer(wallet)
        .buildTx()
    const res = await kwil.broadcast(tx)
    console.log(res)
}

async function select(kwil, dbid, query) {
    const res = await kwil.selectQuery(dbid, query)
    console.log(res)
}

async function configObj(kwil, dbid) {
    const query = await kwil.selectQuery(dbid, "SELECT COUNT(*) FROM posts");

    const count = query.data[0][`COUNT(*)`]

    const bulkActions = [
        {
            "$id": 129,
            "$user": "Luke",
            "$title": "Hello",
            "$body": "Hello World",
        },
        {
            "$id": 130,
            "$user": "Luke",
            "$title": "Hello",
            "$body": "Hello World 2",
        },
        {
            "$id": 131,
            "$user": "Luke",
            "$title": "Hello",
            "$body": "Hello World 3",
        },
    ]

    return bulkActions
}

async function bulkAction(kwil, dbid, action, w) {
    const data = await configObj(kwil, dbid)

    const Input = kwiljs.Utils.ActionInput

    const inputs = new Input()
        .putFromObjects(data)

    const tx = await kwil
        .actionBuilder()
        .dbid(dbid)
        .name(action)
        .concat(inputs)
        .signer(w)
        .buildTx()

    const res = await kwil.broadcast(tx)

    console.log(res)
}