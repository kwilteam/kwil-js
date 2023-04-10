import { ethers } from "ethers";
import { AnyMap } from "../../utils/anyMap";
import Client from "../client/client";
import { Transaction } from "../transactions/transaction";
type NewAction = Record<any, any>;
export declare class Action {
    private readonly dbid;
    private readonly name;
    private readonly client;
    inputs?: string[];
    actions?: AnyMap<any>[];
    constructor(dbid: string, name: string, client: Client);
    init(): Promise<void>;
    newAction(): AnyMap<any>;
    bulkAction(bulkActions: NewAction[]): void;
    isComplete(): boolean;
    prepareAction(signer: ethers.providers.JsonRpcSigner | ethers.Wallet): Promise<Transaction>;
}
export {};
