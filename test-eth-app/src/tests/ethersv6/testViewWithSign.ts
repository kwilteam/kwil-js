import { KwilSigner, WebKwil } from '@kwilteam/kwil-js'

export async function testViewWithSign(kwil: WebKwil, dbid: string, signer: KwilSigner) {
    const res = await kwil.call({
        dbid,
        action: 'view_must_sign'
    }, signer)

    console.log(res)
}