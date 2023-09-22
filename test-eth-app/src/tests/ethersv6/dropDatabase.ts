import { WebKwil } from '@lukelamey/kwil-js'
import { Signer } from 'ethers'

export async function dropDatabase(kwil: WebKwil, dbid: string, pubKey: string, signer: Signer) {
    const tx = await kwil
        .dropDbBuilder()
        .signer(signer)
        .publicKey(pubKey)
        .payload({
            dbid
        })
        .buildTx()

    console.log('tx', tx)

    const res = await kwil.broadcast(tx)
    console.log(res)
}