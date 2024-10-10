import { KwilSigner, WebKwil } from '../../../../src'

export async function testViewWithSign(kwil: WebKwil, dbid: string, signer: KwilSigner) {
    const res = await kwil.call({
        dbid,
        name: 'view_must_sign'
    }, signer)

    console.log(res)
}