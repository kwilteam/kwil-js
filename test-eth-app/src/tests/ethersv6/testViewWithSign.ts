import { KwilSigner, WebKwil } from '@lukelamey/kwil-js'
import { Signer } from 'ethers';

export async function testViewWithSign(kwil: WebKwil, dbid: string, signer: KwilSigner) {
    const res = await kwil.call({
        action: 'view_must_sign',
        dbid,
        description: 'Sign this message to authenticate and get your data!',
    }, signer)

    console.log(res)
}