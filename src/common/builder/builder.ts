import { ethers, JsonRpcSigner } from "ethers";
import { PayloadType } from "../interfaces/tx";
import Client from "../client/client";
import { ITx } from "../interfaces/tx";
import { Transaction } from "../transactions/transaction";

export class DBBuilder {
    public readonly json: object;
    public readonly client: Client;

    constructor(json: object, client: Client) {
        this.json = json;
        this.client = client;
    }

    public async prepareJson(signer: JsonRpcSigner | ethers.Wallet): Promise<Transaction> {
        const readyTx = {
            toObject: () => this.json,
            payloadType: PayloadType.DEPLOY_DATABASE
        }

        const tx = new Transaction(readyTx);

        //sign tx
        tx.tx.sender = (await signer.getAddress()).toLowerCase();

        const acct = await this.client.Accounts.getAccount(tx.tx.sender);
        if(acct.status !== 200 || !acct.data) {
            throw new Error(`Could not retrieve account ${tx.tx.sender}. Please double check that you have the correct account address.`);
        }
        const cost = await this.client.Tx.estimateCost(tx.tx as ITx);
        if(cost.status !== 200 || !cost.data) {
            throw new Error(`Could not retrieve cost for transaction. Please double check that you have the correct account address.`);
        }
        tx.tx.fee = cost.data;
        tx.tx.nonce = Number(acct.data.nonce) + 1;

        tx.generateHash();
        await tx.sign(signer);
        return tx;
    }
}