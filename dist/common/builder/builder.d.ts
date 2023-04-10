import { ethers } from "ethers";
import Client from "../client/client";
import { Transaction } from "../transactions/transaction";
export declare class DBBuilder {
    readonly json: object;
    readonly client: Client;
    constructor(json: object, client: Client);
    prepareJson(signer: ethers.providers.JsonRpcSigner | ethers.Wallet): Promise<Transaction>;
}
