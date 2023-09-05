import { AbstractSigner, BrowserProvider } from "ethers";
import { WebKwil, Utils } from 'luke-dev'
// import { isEthersSigner } from 'luke-dev/dist/utils/keys'
import db from './mydb.json'
import { Wallet as Walletv6 } from "ethers";
import { Wallet as Walletv5, Signer as Signerv5 } from "ethers5";

const kwil = new WebKwil({
    kwilProvider: "http://localhost:8080/",
    timeout: 10000,
    logging: true,
});
export function isV6Signer(obj: any): boolean {
    return obj
        && typeof obj.address === 'string'
}


export function isEthersSigner(signer: any): boolean {
    if(signer instanceof Walletv6 || signer instanceof Walletv5 || signer instanceof Signerv5 || isV6Signer(signer)) {
        return true
    }

    return false
}

export async function deployDb() : Promise<void> {
    const provider = new BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    console.log(signer)
    const pubkey = await Utils.recoverSecp256k1PubKey(signer)
    console.log(isEthersSigner(signer))

    const tx = await kwil
        .dbBuilder()
        .payload(db)
        .publicKey(pubkey)
        .signer(signer)
        .buildTx()

    const rec = await kwil.broadcast(tx)
    console.log(    rec)
    // console.log(await kwil.ping())
}