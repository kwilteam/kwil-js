import { WebKwil } from '@lukelamey/kwil-js'
import { Signer } from 'ethers';

export async function testViewWithSign(kwil: WebKwil, dbid: string, signer: Signer, pubkey: string) {
    const msg = await kwil
        .actionBuilder()
        .dbid(dbid)
        .name('view_must_sign')
        .description('Sign this message to authenticate and get your data!')
        .signer(signer)
        .publicKey(pubkey)
        .buildMsg()

    const res = await kwil.call(msg);

    console.log(res)
}