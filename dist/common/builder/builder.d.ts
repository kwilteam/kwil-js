import { ethers, Signer } from "ethers";
import Client from "../client/client";
import { Transaction } from "../transactions/transaction";
export declare class DBBuilder {
    readonly json: object;
    readonly client: Client;
    constructor(json: object, client: Client);
    prepareJson(signer: Signer | ethers.Wallet): Promise<Transaction>;
}
