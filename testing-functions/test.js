// this file is mostly for if i want to call a function quickly without having to run the whole test suite
// this is not a part of the test suite and should not be run by jest

const kwiljs = require("../dist/index")
const ethers = require("ethers")
const testDB = require("./mydb.json")
const util = require("util")
const near = require('near-api-js')
const { from_b58 } = require('../dist/utils/base58')
const { bytesToHex } = require('../dist/utils/serial')

near.Signer
require("dotenv").config()

function logger(msg) {
    console.log(util.inspect(msg, false, null, true /* enable colors */))
}

async function test() {
    //update to goerli when live
    const provider = new ethers.JsonRpcProvider(process.env.ETH_PROVIDER)
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider)
    const txHash = '0xf2a1a842522df00bde3fdd417d42cd6818a8bb803312a28552d99db445443bdc'

    const kwil = new kwiljs.NodeKwil({
        kwilProvider: process.env.KWIL_PROVIDER || "SHOULD FAIL",
        timeout: 10000,
        logging: true,
    })

    const pubKey = await recoverPubKey(wallet)

    const dbid = kwil.getDBID(pubKey, "mydb")
    logger(dbid)
    // broadcast(kwil, testDB, wallet, pubKey)
    // await getTxInfo(kwil, txHash)
    await getSchema(kwil, dbid)
    // getAccount(kwil, pubKey)
    // listDatabases(kwil, pubKey)
    // ping(kwil)
    // getFunder(kwil, wallet)
    // getAllowance(kwil, wallet)
    // getBalance(kwil, wallet)
    // await approve(kwil, wallet, BigInt(10 * 10^18))
    // await deposit(kwil, wallet, BigInt(10 * 10^18))
    // getDepositedBalance(kwil, wallet)
    // getTokenAddress(kwil, wallet)
    // await execSingleAction(kwil, dbid, "add_post", wallet, pubKey)
    // select(kwil, dbid, "SELECT * FROM posts")
    // select(kwil, dbid, `WITH RECURSIVE 
    //                          cnt(x) AS (
    //                          SELECT 1
    //                          UNION ALL
    //                          SELECT x+1 FROM cnt
    //                          LIMIT (SELECT MAX(id) FROM posts)
    //                      )
    //                      SELECT x 
    //                      FROM cnt
    //                      WHERE x NOT IN (SELECT id FROM posts) AND x <= 135;
    //          `)
    // bulkAction(kwil, dbid, "add_post", wallet, pubKey)
    // getSelectAction(kwil, dbid, "select_posts", wallet)
    // await dropDb(kwil, dbid, wallet, pubKey)
    // getSelectAction(kwil, dbid2, "get_items", wallet)
    // await testNonViewAction(kwil, dbid, wallet)
    // await testViewWithParam(kwil, dbid, wallet)
    // await testViewWithSign(kwil, dbid, wallet, pubKey)
    // decodebase58('AvnZPs4WBHx6RTfzAe62iWWhb6SZTFNJ9obCm2KbUe39')
}

test()

async function getSchema(kwil, d) {
    const schema = await kwil.getSchema(d)
    logger(schema.data)
}

async function getAccount(kwil, owner) {
    const account = await kwil.getAccount(owner)
    logger(account)
}

async function broadcast(kwil, tx, sig, pK) {
    let ownedTx = tx
    ownedTx.owner = sig.address
    const readytx = await kwil
        .dbBuilder()
        .payload(ownedTx)
        .signer(sig)
        .publicKey(pK)
        .buildTx()

    logger('readytx', readytx)
    const txHash = await kwil.broadcast(readytx)
    logger(txHash)
}

async function listDatabases(kwil, owner) {
    const databases = await kwil.listDatabases(owner)
    logger(databases)
}

async function ping(kwil) {
    const ping = await kwil.ping()
    logger(ping)
}

async function getFunder(kwil, w) {
    const funder = await kwil.getFunder(w)
    logger(funder)
}

async function getAllowance(kwil, w) {
    const funder = await kwil.getFunder(w)
    const allowance = await funder.getAllowance(w.address)
    logger(allowance)
}

async function getBalance(kwil, w) {
    const funder = await kwil.getFunder(w)
    const balance = await funder.getBalance(w.address)
    logger(balance)
}

async function approve(kwil, w, amount) {
    const funder = await kwil.getFunder(w)
    const tx = await funder.approve(amount)
    logger(tx)
}

async function deposit(kwil, w, amount) {
    const funder = await kwil.getFunder(w)
    const tx = await funder.deposit(amount)
    logger(tx)
}

async function getDepositedBalance(kwil, w) {
    const funder = await kwil.getFunder(w)
    const balance = await funder.getDepositedBalance(w.address)
    logger(balance)
}

async function getTokenAddress(kwil, w) {
    const funder = await kwil.getFunder(w)
    const tokenAddress = await funder.getTokenAddress()
    logger(tokenAddress)
}

async function getAction(kwil) {
    const res = await kwil.actionBuilder()
    logger(res)
}

async function execSingleAction(kwil, dbid, action, w, pubKey) {
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
        .publicKey(pubKey)
        .signer(w)
        .buildTx();

    const res = await kwil.broadcast(act)

    logger(res)
}

async function getSelectAction(kwil, dbid, selectAction, wallet) {
    const tx = await kwil
        .actionBuilder()
        .dbid(dbid)
        .name(selectAction)
        .signer(wallet)
        .buildTx()
    const res = await kwil.broadcast(tx)
    logger(res)
}

async function select(kwil, dbid, query) {
    const res = await kwil.selectQuery(dbid, query)
    logger(res)
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

async function bulkAction(kwil, dbid, action, w, pubKey) {
    const data = await configObj(kwil, dbid)

    const Input = kwiljs.Utils.ActionInput

    const inputs = new Input()
        .putFromObjects(data)

    const tx = await kwil
        .actionBuilder()
        .dbid(dbid)
        .name(action)
        .concat(inputs)
        .publicKey(pubKey)
        .signer(w)
        .buildTx()

    const res = await kwil.broadcast(tx)

    logger(res)
}

async function getTxInfo(kwil, hash) {
    const res = await kwil.txInfo(hash);
    logger(res)
}

async function dropDb(kwil, dbid, w, pubKey) {
    const tx = await kwil
        .dropDbBuilder()
        .signer(w)
        .publicKey(pubKey)
        .payload({
            dbid
        })
        .buildTx()

    const res = await kwil.broadcast(tx)

    logger(res)
}

async function testNonViewAction(kwil, dbid, wallet) {
    const tx = await kwil
        .actionBuilder()
        .dbid(dbid)
        .name('read_posts')
        .signer(wallet)
        .buildTx()

    const res = await kwil.broadcast(tx)

    logger(res.data)
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

    logger(msg)

    const res = await kwil.call(msg);

    logger(res.data.result)
}

async function testViewWithSign(kwil, dbid, wallet, pubKey) {
    const msg = await kwil
        .actionBuilder()
        .dbid(dbid)
        .name('view_must_sign')
        .publicKey(pubKey)
        .signer(wallet)
        .buildMsg()

    logger(msg)
    const res = await kwil.call(msg);

    logger(res.data.result)
}

async function recoverPubKey(signer) {
    return await kwiljs.Utils.recoverSecp256k1PubKey(signer)
}

function decodebase58(string) {
    console.log(bytesToHex(from_b58(string)))
}