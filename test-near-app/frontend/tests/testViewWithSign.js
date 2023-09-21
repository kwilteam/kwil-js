export async function testViewWithSign(kwil, dbid, signer, wallet, pubkey) {
    const msg = await kwil
        .actionBuilder()
        .dbid(dbid)
        .name('view_must_sign')
        .signer(signer, 'ed25519_nr')
        .publicKey(pubkey)
        .buildMsg()

    const res = await kwil.call(msg);

    console.log(res)
}