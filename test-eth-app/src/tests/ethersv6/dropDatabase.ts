import { KwilSigner, WebKwil } from '../../../../src'

export async function dropDatabase(kwil: WebKwil, dbid: string, signer: KwilSigner) {
    const res = await kwil.drop({
        dbid,
        description: 'This transaction will drop the database!'
    }, signer, true)
    
    console.log(res)
}