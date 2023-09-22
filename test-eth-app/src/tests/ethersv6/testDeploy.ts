import { AbstractSigner, BrowserProvider } from "ethers";
import { WebKwil, Utils } from '@lukelamey/kwil-js'
// import { isEthersSigner } from 'luke-dev/dist/utils/keys'
import db from '../mydb.json'
import { Wallet as Walletv6 } from "ethers";
import { Wallet as Walletv5, Signer as Signerv5 } from "ethers5";
import { kwil } from "../testUtils";
import { Signer } from "ethers";

export function isV6Signer(obj: any): boolean {
    return obj instanceof AbstractSigner
}

export function isEthersSigner(signer: any): boolean {
    if(signer instanceof Walletv6 || signer instanceof Walletv5 || signer instanceof Signerv5 || isV6Signer(signer)) {
        return true
    }

    return false
}

export async function deployDb(signer: Signer, pubkey: string) : Promise<void> {
    const tx = await kwil
        .dbBuilder()
        .payload(db)
        .publicKey(pubkey)
        .signer(signer)
        .buildTx()

    const rec = await kwil.broadcast(tx)
    console.log(rec)
    // console.log(await kwil.listDatabases(pubkey))
    // console.log(await kwil.ping())
}