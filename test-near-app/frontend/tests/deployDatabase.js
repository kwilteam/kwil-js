import mydb from '../mydb.json'

export async function deployDatabase(kwil, signer, pubKey, wallet) {
    const tx = await kwil
        .dbBuilder()
        .payload(mydb)
        .signer(signer)
        .publicKey(pubKey)
        .nearConfig(wallet.accountId, 'testnet')
        .buildTx()

    const res = await kwil.broadcast(tx)

    console.log(res)
}