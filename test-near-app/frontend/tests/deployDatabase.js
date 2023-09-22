import mydb from '../mydb.json'

export async function deployDatabase(kwil, signer, pubKey) {
    const tx = await kwil
        .dbBuilder()
        .payload(mydb)
        .signer(signer, 'ed25519_nr')
        .publicKey(pubKey)
        .buildTx()

    console.log(tx)

    const res = await kwil.broadcast(tx)

    console.log(res)
}