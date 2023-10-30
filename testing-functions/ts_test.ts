import { Wallet, JsonRpcProvider } from "ethers";
import { KwilSigner, NodeKwil, Utils } from "../dist/index";
import { ActionBody } from "../dist/core/action";
import { DeployBody, DropBody } from "../dist/core/database";
import compiledKf from "./mydb.json";
require('dotenv').config()

const kwil = new NodeKwil({
    kwilProvider: "http://localhost:8080",
    chainId: ""
})

const provider = new JsonRpcProvider(process.env.ETH_PROVIDER)
const wallet = new Wallet(process.env.PRIVATE_KEY as string, provider)

async function buildSigner() {
    const pk = await Utils.recoverSecp256k1PubKey(wallet);
    return new KwilSigner(wallet, pk);
}

async function main() {
    const signer = await buildSigner();

    // actions
    const actionBody: ActionBody = {
        dbid: 'xd924382720df474c6bb62d26da9aeb10add2ad2835c0b7e4a6336ad8',
        action: 'add_post',
        inputs: [{
            "$id": 69,
            "$user": "Luke",
            "$title": "Test Post",
            "$body": "This is a test post"
        }],
        description: "Add a post"
    }

    // execute
    await kwil.execute(actionBody, signer);

    //call with signer
    await kwil.call(actionBody, signer);

    //call without signer
    await kwil.call(actionBody);

    // deploy database
    const deployBody: DeployBody = {
        schema: compiledKf,
        description: "My first database"
    }

    // deploy
    await kwil.deploy(deployBody, signer);
    
    // drop database
    const dropBody: DropBody = {
        dbid: 'abc123',
        description: "Drop this database"
    }

    // drop
    await kwil.drop(dropBody, signer);
}

main()
