// this file is mostly for if i want to call a function quickly without having to run the whole test suite
// this is not a part of the test suite and should not be run by jest

const kwiljs = require("../dist/index")
const ethers = require("ethers")
const testDB = require("./test_schema.json")
require("dotenv").config()

async function test() {
    //update to goerli when live
    const provider = new ethers.JsonRpcProvider(process.env.ETH_PROVIDER)
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider)
    const txHash = '0x651965102a6f77231d920eddbf3e90010e053c1486601d8a7921fdd4c5b59b9c'

    const kwil = new kwiljs.NodeKwil({
        kwilProvider: process.env.KWIL_PROVIDER || "SHOULD FAIL",
        timeout: 10000,
        logging: true,
    })

    const dbid = kwil.getDBID(wallet.address, "mydb")
    // const dbid2 = kwil.getDBID(wallet.address, "selectaction")
    // console.log(dbid)
    broadcast(kwil, testDB, wallet)
    // await getSchema(kwil, dbid)
    // await getSchema(kwil, dbid2)
    // getAccount(kwil, wallet.address)
    // listDatabases(kwil, wallet.address)
    // ping(kwil)
    // getFunder(kwil, wallet)
    // getAllowance(kwil, wallet)
    // getBalance(kwil, wallet)
    // await approve(kwil, wallet, BigInt(10 * 10^18))
    // await deposit(kwil, wallet, BigInt(10 * 10^18))
    // getDepositedBalance(kwil, wallet)
    // getTokenAddress(kwil, wallet)
    // await execSingleAction(kwil, dbid, "add_post", wallet)
    // select(kwil, dbid, "SELECT * FROM posts")
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
    // getSelectAction(kwil, dbid, "select_posts", wallet)
    await getTxInfo(kwil, txHash)
    // await dropDb(kwil, dbid, wallet)
    // getSelectAction(kwil, dbid2, "get_items", wallet)
    // await dropDb(kwil, wallet)
    // await testNonViewAction(kwil, dbid, wallet)
    // await testViewWithParam(kwil, dbid, wallet)
    // await testViewWithSign(kwil, dbid, wallet)
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
    let ownedTx = tx
    ownedTx.owner = sig.address
    const readytx = await kwil
        .dbBuilder()
        .payload(ownedTx)
        .signer(sig)
        .buildTx()

    console.log('readytx', readytx)
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
    const query = await kwil.selectQuery(dbid, "SELECT COUNT(*) FROM posts");

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

async function getTxInfo(kwil, hash) {
    const res = await kwil.txInfo(hash);
    console.log(res)
}

async function dropDb(kwil, dbid, w) {
    const tx = await kwil
        .dropDBBuilder()
        .signer(w)
        .payload({
            dbid
        })
        .buildTx()

    const res = await kwil.broadcast(tx)

    console.log(res)
}

async function testNonViewAction(kwil, dbid, wallet) {
    const tx = await kwil
        .actionBuilder()
        .dbid(dbid)
        .name('read_posts')
        .signer(wallet)
        .buildTx()

    const res = await kwil.broadcast(tx)

    console.log(res.data)
}

async function testViewWithParam(kwil, dbid, wallet) {
    const actionInput = kwiljs.Utils.ActionInput
        .of()
        .put("$id", 1)

    const msg = await kwil
        .actionBuilder()
        .dbid(dbid)
        .name('view_with_param')
        .concat(actionInput)
        .buildMsg()

    const res = await kwil.call(msg);

    console.log(res.data.result)
}

async function testViewWithSign(kwil, dbid, wallet) {
    const msg = await kwil
        .actionBuilder()
        .dbid(dbid)
        .name('view_must_sign')
        .signer(wallet)
        .buildMsg()

    const res = await kwil.call(msg);

    console.log(res.data.result)
}