import { WebKwil } from '../../../../src/index'
import { Signer } from 'ethers'

export async function dropDatabase(kwil: WebKwil, dbid: string, pubKey: string, signer: Signer) {
    const tx = await kwil
        .dropDbBuilder()
        .signer(signer)
        .publicKey(pubKey)
        .description('This transaction will drop the database!')
        .payload({
            dbid
        })
        .buildTx()

    console.log('tx', tx)

    const res = await kwil.broadcast(tx)
    console.log(res)
}