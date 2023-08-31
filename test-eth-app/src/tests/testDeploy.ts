import { BrowserProvider } from "ethers";
import { WebKwil, Utils } from "luke-dev";
import { Signer } from "ethers5";
import db from './mydb.json'

const kwil = new WebKwil({
    kwilProvider: "http://localhost:8080/",
    timeout: 10000,
    logging: true,
});

export async function deployDb() : Promise<void> {
    // const provider = new BrowserProvider(window.ethereum)
    // const signer = await provider.getSigner()
    // const pubkey = await Utils.recoverSecp256k1PubKey(signer as unknown as Signer)
    // const dbid = kwil.getDBID(pubkey, "mydb")

    // const tx = await kwil
    //     .dbBuilder()
    //     .payload(db)
    //     .signer(signer as unknown as Signer)
    //     .buildTx()

    // const rec = await kwil.broadcast(tx)
    // console.log(    rec)
    console.log(await kwil.ping())
}