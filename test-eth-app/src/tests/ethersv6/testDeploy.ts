import { AbstractSigner, BrowserProvider } from "ethers";
import { WebKwil, Utils, KwilSigner } from '../../../../src'
// import { isEthersSigner } from 'luke-dev/dist/utils/keys'
import db from '../mydb.json'
import { Wallet as Walletv6 } from "ethers";
import { Wallet as Walletv5, Signer as Signerv5 } from "ethers5";
import { kwil } from "../testUtils";


export function isV6Signer(obj: any): boolean {
    return obj instanceof AbstractSigner
}

export function isEthersSigner(signer: any): boolean {
    if(signer instanceof Walletv6 || signer instanceof Walletv5 || signer instanceof Signerv5 || isV6Signer(signer)) {
        return true
    }

    return false
}

export async function deployDb(signer: KwilSigner) : Promise<void> {
    const res = await kwil.deploy({
        schema: db,
        description: 'This is a test deployment',
    }, signer, true)

    console.log(res)
    // console.log(await kwil.listDatabases(pubkey))
    // console.log(await kwil.ping())
}