import { WebKwil, Utils } from "@lukelamey/kwil-js";
import { Signer } from "ethers";

export async function executeAction(kwil: WebKwil, dbid: string, action: string, signer: Signer, pubKey: string): Promise<void> {
    const query = await kwil.selectQuery(dbid, "SELECT COUNT(*) FROM posts");
    console.log(query)
    //@ts-ignore
    const count = query.data[0][`COUNT(*)`]

    const actionInput = Utils.ActionInput
        .of()
        .put("$id", count + 1)
        .put("$user", "Luke")
        .put("$title", "Hello")
        .put("$body", "Hello World")

        const tx = await kwil
        .actionBuilder()
        .dbid(dbid)
        .name(action)
        .concat(actionInput)
        .publicKey(pubKey)
        .signer(signer)
        .buildTx();

        const res = await kwil.broadcast(tx)
        console.log(res)
}