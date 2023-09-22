export async function dropDatabase(kwil, dbName, pubKey, signer, wallet) {
    const dbid = kwil.getDBID(pubKey, dbName)

    console.log(wallet.accountId)
    const tx = await kwil
        .dropDbBuilder()
        .signer(signer, 'ed25519_nr')
        .publicKey(pubKey)
        .payload({
            dbid
        })
        .buildTx()

    console.log('tx', tx)

    const res = await kwil.broadcast(tx)
    console.log(res)
}