import { Wallet, JsonRpcProvider } from "ethers";
import { KwilSigner, NodeKwil, Utils } from "../dist/index";
import { ActionBody } from "../dist/core/action";
import { DeployBody, DropBody } from "../dist/core/database";
import compiledKf from "./math.kf.json";
import { TransferBody } from "../dist/funder/funding_types";
require('dotenv').config()

const kwil = new NodeKwil({
    kwilProvider: process.env.KWIL_PROVIDER as string,
    chainId: process.env.CHAIN_ID as string,
    logging: true,
})

const provider = new JsonRpcProvider(process.env.ETH_PROVIDER)
const wallet = new Wallet(process.env.PRIVATE_KEY as string, provider)

async function buildSigner() {
    return new KwilSigner(wallet, await wallet.getAddress());
}

async function main() {
    const signer = await buildSigner();

    // actions
    const actionBody: ActionBody = {
        dbid: kwil.getDBID(signer.identifier, 'mydb'),
        action: 'view_must_sign',
        inputs: [{
            "$id": 69,
            "$user": "Luke",
            "$title": "Test Post",
            "$body": "This is a test post"
        }],
        description: "Add a post"
    }

    // execute
    // await kwil.execute(actionBody, signer);

    //call with signer
    const callRes = await kwil.call(actionBody, signer);
    console.log(callRes);

    //call without signer
    // await kwil.call(actionBody);

    // deploy database
    const deployBody: DeployBody = {
        schema: compiledKf,
        description: "My first database"
    }

    // deploy
    // await kwil.deploy(deployBody, signer);
    
    // drop database
    const dropBody: DropBody = {
        dbid: 'abc123',
        description: "Drop this database"
    }

    // drop
    // await kwil.drop(dropBody, signer);

    const funderTest: TransferBody = {
        to: "0xdB8C53Cd9be615934da491A7476f3f3288d98fEb",
        amount: BigInt(1 * 10 ** 18),
    }

    // transfer
    // const res = await kwil.funder.transfer(funderTest, signer);
    // console.log(res);
}

main()
