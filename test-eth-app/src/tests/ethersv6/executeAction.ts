import { WebKwil, Utils, KwilSigner } from "@lukelamey/kwil-js";
import { Signer } from "ethers";

export async function executeAction(kwil: WebKwil, dbid: string, action: string, signer: KwilSigner): Promise<void> {
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

    const res = await kwil.execute({
        dbid,
        action,
        inputs: [actionInput],
        description: 'This is a test action',
    }, signer, true)

    console.log(res)
}