import { KwilSigner, WebKwil } from '@lukelamey/kwil-js'

export async function dropDatabase(kwil: WebKwil, dbid: string, signer: KwilSigner) {
    const res = await kwil.drop({
        dbid,
        description: 'This transaction will drop the database!'
    }, signer, true)
    
    console.log(res)
}