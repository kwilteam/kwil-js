import { providers } from "ethers5";
import { Types, Utils } from "luke-dev"
import { kwil } from "./testUtils";

interface AmntObject {
    "COUNT(*)": number;
}

export async function testV5Transaction() {
    await window.ethereum.enable();

    const provider = new providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner()
    const address = await signer.getAddress()

    const pubkey = await Utils.recoverSecp256k1PubKey(signer)

    const dbid = kwil.getDBID(address, "mydb")

    let actionBuilder: Types.ActionBuilder = kwil
        .actionBuilder()
        .dbid(dbid)
        .name("add_post")

    let recordCount: number;    
    const count = await kwil.selectQuery(dbid, "SELECT COUNT(*) FROM posts");
    if (count.status == 200 && count.data) {
        const amnt = count.data[0] as AmntObject;
        recordCount = amnt['COUNT(*)'];
    } else {
        throw new Error("Could not get record count")
    }

    const actionInput: Types.ActionInput = Utils.ActionInput.fromObject({
        "$id": recordCount + 1,
        "$user": "Luke",
        "$title": "Test Post",
        "$body": "This is a test post"
    })

    const actionTx: Types.Transaction = await actionBuilder
        .concat(actionInput)
        .signer(signer)
        .publicKey(pubkey)
        .buildTx()

    const res: Types.GenericResponse<Types.TxReceipt> = await kwil.broadcast(actionTx)

    console.log("res", res)
}