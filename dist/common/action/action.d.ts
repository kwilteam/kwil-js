import { ethers, JsonRpcSigner } from "ethers";
import { AnyMap } from "../../utils/anyMap";
import Client from "../client/client";
import { Transaction } from "../transactions/transaction";
type NewAction = Record<any, any>;
export declare class Action {
    private readonly dbid;
    private readonly name;
    private client;
    inputs?: string[];
    actions?: AnyMap<any>[];
    private constructor();
    static retrieve(dbid: string, name: string, client: Client): Promise<Action>;
    newInstance(): AnyMap<any>;
    bulk(bulkActions: NewAction[]): void;
    isComplete(): boolean;
    prepareAction(signer: JsonRpcSigner | ethers.Wallet): Promise<Transaction>;
}
export {};
