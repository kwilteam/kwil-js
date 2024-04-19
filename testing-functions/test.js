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
const { bytesToHex, hexToBytes, stringToBytes } = require('../dist/utils/serial')
const { bytesToBase64 } = require('../dist/utils/base64')
const scrypt = require("scrypt-js")
const nacl = require("tweetnacl")
const { sha256BytesToBytes } = require("../dist/utils/crypto")
const { KwilSigner } = require("../dist/core/kwilSigner")
const { ActionInput } = require("../dist/core/action")

require("dotenv").config()

const chainId = process.env.CHAIN_ID || "SHOULD FAIL"

function logger(msg) {
    console.log(util.inspect(msg, false, null, true /* enable colors */))
}

async function test() {
    //update to goerli when live
    const provider = new ethers.JsonRpcProvider(process.env.ETH_PROVIDER)
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider)
    const txHash = 'b1ac84b20a99b7ad42435d653e4ed21c4cfa86c88b929e385f33664314ab5bec'
    const address = await wallet.address

    const getEdKeys = async () => {
        const key = await deriveKeyPair64("password", "humanId")
        return key
    }

    const kwil = new kwiljs.NodeKwil({
        kwilProvider: process.env.KWIL_PROVIDER || "SHOULD FAIL",
        chainId: chainId,
        timeout: 10000,
        logging: true,
    })

    const kwilSigner = new KwilSigner(wallet, address)
    
    const dbid = kwil.getDBID(address, "mydb")
    logger(dbid)
    // await authenticate(kwil, kwilSigner)
    // broadcast(kwil, testDB, wallet, address)
    // broadcastEd25519(kwil, simpleDb)
    // await getTxInfo(kwil, txHash)
    // await getSchema(kwil, dbid)
    // getAccount(kwil, address)
    listDatabases(kwil)
    // ping(kwil)
    // chainInfo(kwil)
    // await execSingleAction(kwil, dbid, "add_post", wallet, address)
    // await execSingleActionKwilSigner(kwil, dbid, "add_post", kwilSigner)
    // await select(kwil, dbid, "SELECT * FROM posts")
    // bulkAction(kwil, dbid, "add_post", wallet, address)
    // await testViewWithParam(kwil, dbid, wallet)
    // await testViewWithSign(kwil, dbid, kwilSigner)
    // await testViewWithEdSigner(kwil, dbid)
    // await customSignature(kwil, dbid)
    // await julioSignature(kwil, dbid)
    // await customEd25519(kwil, dbid)
    // await dropDb(kwil, dbid, wallet, address)
    // await transfer(kwil, "0xAfFDC06cF34aFD7D5801A13d48C92AD39609901D", 100, kwilSigner)
    // bulkActionInput(kwil, kwilSigner)
}

test()

async function authenticate(kwil, signer) {
    const res = await kwil.authenticate(signer)
    logger(res)
}

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
        .chainId(chainId)
        .buildTx()

    console.log(readytx)

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

async function chainInfo(kwil) {
    const info = await kwil.chainInfo();
    logger(info)
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
        .put("$id", count)
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

    const startTime = Date.now()

    const res = await kwil.broadcast(act, 2)

    logger(res)
}

async function execSingleActionKwilSigner(kwil, dbid, action, kSigner) {
    const query = await kwil.selectQuery(dbid, "SELECT COUNT(*) FROM posts");
    const count = query.data[0][`COUNT(*)`]

    const Input = kwiljs.Utils.ActionInput
        .of()
        .put("$id", count + 1)
        .put("$user", "Luke")
        .put("$title", "Hello")
        .put("$body", "Hello World")

    const body = {
        dbid,
        action,
        inputs: [Input],
        description: 'This is my friendly description!',
    }

    const startTime = Date.now()
    const res = await kwil.execute(body, kSigner, true)
    const endTime = Date.now()
    console.log(`Time: ${endTime - startTime}ms`)

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
            "$id": count + 1,
            "$user": "Luke",
            "$title": "Hello",
            "$body": "Hello World",
        },
        {
            "$id": count + 2,
            "$user": "Luke",
            "$title": "Hello",
            "$body": "Hello World 2",
        },
        {
            "$id": count + 3,
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

async function testViewWithSign(kwil, dbid, signer) {
    const body = {
        action: "view_must_sign",
        dbid,
        inputs: []
    }

    const res = await kwil.call(body, signer)

    logger(res)
}

async function testViewWithEdSigner(kwil, dbid) {
    const key = await deriveKeyPair64("password", "humanId")

    const signCallback = (msg) => nacl.sign.detached(msg, key.secretKey)

    const kwilSigner = new KwilSigner(signCallback, key.publicKey, 'ed25519')

    const body = {
        action: "view_must_sign",
        dbid,
    }


    const res = await kwil.call(body, kwilSigner);

    logger(res)
}

async function broadcastEd25519(kwil, db) {
    const key = await deriveKeyPair64("password", "humanId")

    const signCallback = (msg) => nacl.sign.detached(msg, key.secretKey)

    const signer = new KwilSigner(signCallback, key.publicKey, 'ed25519')

    const res = await kwil.deploy({
        schema: db
    }, signer)

    logger(res)
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

async function transfer(kwil, to, tokenAmnt, signer) {
    const payload = {
        to,
        amount: BigInt(tokenAmnt * 10 ** 18)
    }

    const res = await kwil.funder.transfer(payload, signer)
    logger(res)
}

async function bulkActionInput(kwil, signer) {
    const dbid = kwil.getDBID(signer.identifier, "mydb")
    const query = await kwil.selectQuery(dbid, "SELECT COUNT(*) FROM posts");
    const count = query.data[0][`COUNT(*)`]

    let inputs = []

    for (let i = 0; i < 100; i++) {
        inputs.push(ActionInput.fromObject({
            $id: count + i,
            $user: "Luke",
            $title: "Hello",
            $body: "Hello World"
        }))
    }

    console.log(inputs)

    const body = {
        dbid,
        action: "add_post",
        inputs,
        description: 'This is my friendly description!',
    }

    const res = await kwil.execute(body, signer);

    logger(res)
}