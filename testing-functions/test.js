// this file is mostly for if i want to call a function quickly without having to run the whole test suite
// this is not a part of the test suite and should not be run by jest

const kwiljs = require("../dist/index")
const ethers = require("ethers")
const testDB = require("./mydb.json")
const simpleDb = require("./test_schema_simple.json")
const fractalDb = require("./fractal_db.json")
const util = require("util")
const near = require('near-api-js')
const { from_b58 } = require('../dist/utils/base58')
const { bytesToHex, hexToBytes } = require('../dist/utils/serial')
const scrypt = require("scrypt-js")
const nacl = require("tweetnacl")
const { sha256BytesToBytes } = require("../dist/utils/crypto")
const { KwilSigner } = require("../dist/core/kwilSigner")

require("dotenv").config()

function logger(msg) {
    console.log(util.inspect(msg, false, null, true /* enable colors */))
}

async function test() {
    //update to goerli when live
    const provider = new ethers.JsonRpcProvider(process.env.ETH_PROVIDER)
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider)
    const txHash = '3b1afbf33ae847f65945b478c347ebdd2b5e8fd6b69fd244a8fd1273cfa03cb4'
    
    const kwil = new kwiljs.NodeKwil({
        kwilProvider: process.env.KWIL_PROVIDER || "SHOULD FAIL",
        timeout: 10000,
        logging: true,
    })

    const pubKey = await recoverPubKey(wallet)
    const kwilSigner = new KwilSigner(wallet, pubKey)

    const pubByte = hexToBytes(pubKey)
    const dbid = kwil.getDBID(pubByte, "mydb")
    // logger(dbid)
    // broadcast(kwil, testDB, wallet, pubKey)
    // await getTxInfo(kwil, txHash)
    // await getSchema(kwil, dbid)
    // getAccount(kwil, pubByte)
    // listDatabases(kwil, pubByte)
    // ping(kwil)
    // await execSingleAction(kwil, dbid, "add_post", wallet, pubByte)
    // await select(kwil, dbid, "SELECT * FROM posts")
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
    // await testViewWithParam(kwil, dbid, wallet)
    // await testViewWithSign(kwil, dbid, wallet, pubByte)
    // await customSignature(kwil, dbid)
    // await julioSignature(kwil, dbid)
    // await customEd25519(kwil, dbid)
    // await dropDb(kwil, dbid, wallet, pubByte)
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
    ownedTx.owner = pK
    const readytx = await kwil
        .dbBuilder()
        .payload(ownedTx)
        .signer(sig)
        .publicKey(pK)
        .buildTx()

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
        .description('This is my friendly description!')
        .publicKey(pubKey)
        .signer(w)
        .buildTx();

    const res = await kwil.broadcast(act)

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
        .description('This is my friendly description!')
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

async function customSignature(kwil, dbid) {
    const query = await kwil.selectQuery(dbid, "SELECT COUNT(*) FROM posts");

    const count = query.data[0][`COUNT(*)`]

    const Input = kwiljs.Utils.ActionInput

    const solo = Input.of()
        .put("$id", count + 1)
        .put("$user", "Luke")
        .put("$title", "Hello")
        .put("$body", "Hello World")

    const key = await deriveKeyPair64("password", "humanId")

    const signCallback = (msg) => nacl.sign.detached(msg, key.secretKey)

    const tx = await kwil
        .actionBuilder()
        .dbid(dbid)
        .name("add_post")
        .concat(solo)
        .publicKey(key.publicKey)
        .signer(signCallback, 'ed25519')
        .buildTx();


    const res = await kwil.broadcast(tx)

    logger(res)
}

async function julioSignature(kwil, dbid) {
    const key = await deriveKeyPair64("password", "humanId")

    const signer = {
        signMessage: async (msg) => {
            return nacl.sign.detached(msg, key.secretKey)
        },
    }

    const msg = await kwil
        .actionBuilder()
        .dbid(dbid)
        .name("view_must_sign")
        .publicKey(key.publicKey)
        .signer(signer.signMessage, 'ed25519')
        .buildMsg();

    const res = await kwil.call(msg)

    logger(res)
}

const deriveKeyPair64 = async (password, humanId) => {
    const encoder = new TextEncoder();

    const normalizedPassword = encoder.encode(password.normalize("NFKC"));
    const salt = encoder.encode(humanId);

    const derivedKey = await scrypt.scrypt(normalizedPassword, salt, 1024, 8, 1, 32);

    return nacl.sign.keyPair.fromSeed(derivedKey);
};

async function customEd25519(kwil, dbid) {
    const query = await kwil.selectQuery(dbid, "SELECT COUNT(*) FROM posts");

    const count = query.data[0][`COUNT(*)`]

    const Input = kwiljs.Utils.ActionInput

    const solo = Input.of()
        .put("$id", count + 1)
        .put("$user", "Luke")
        .put("$title", "Hello")
        .put("$body", "Hello World")

    const keys = nacl.sign.keyPair();
    const customSigner = (msg) => nacl.sign.detached(msg, keys.secretKey);

    const tx = await kwil
        .actionBuilder()
        .dbid(dbid)
        .name('add_post')
        .concat(solo)
        .publicKey(keys.publicKey)
        .signer(customSigner, 'ed25519')
        .buildTx()

    const res = await kwil.broadcast(tx);

    logger(res)
}