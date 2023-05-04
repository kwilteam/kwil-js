import { ethers, JsonRpcSigner } from "ethers";
import { AnyMap } from "../../utils/anyMap";
import Client from "../client/client";
import { Transaction } from "../transactions/transaction";
import { Database } from "../interfaces/database";
import { GenericResponse } from "../client/requests";
type NewAction = Record<any, any>;
export declare class Action {
    private readonly dbid;
    private readonly name;
    inputs?: string[];
    actions?: AnyMap<any>[];
    private static clientMap;
    private constructor();
    static retrieve(dbid: string, name: string, client: Client, schema: GenericResponse<Database<string>>): Promise<Action>;
    newInstance(): AnyMap<any>;
    bulk(bulkActions: NewAction[]): void;
    isComplete(): boolean;
    prepareAction(signer: JsonRpcSigner | ethers.Wallet): Promise<Transaction>;
}
export {};
