import {NonNil} from "../utils/types";
import {PayloadType, Transaction} from "./tx";
import {ethers, JsonRpcSigner} from "ethers";

export interface TxnBuilder {
    payloadType(payloadType: NonNil<PayloadType>): NonNil<TxnBuilder>;

    signer(signer: NonNil<JsonRpcSigner | ethers.Wallet>): NonNil<TxnBuilder>;

    payload(payload: (() => NonNil<object>) | NonNil<object>): NonNil<TxnBuilder>;

    build(): Promise<Transaction>;
}

export interface DBBuilder {
    signer(signer: JsonRpcSigner | ethers.Wallet): NonNil<DBBuilder>;

    payload(payload: (() => NonNil<object>) | NonNil<object>): NonNil<DBBuilder>;

    buildTx(): Promise<Transaction>;
}

type NewAction = Record<any, any>

export interface ActionBuilder {
    name(actionName: string): NonNil<ActionBuilder>;

    dbid(dbid: string): NonNil<ActionBuilder>;

    set(key: string, value: unknown): NonNil<ActionBuilder>;

    setMany(actions: Iterable<NewAction>): NonNil<ActionBuilder>;

    buildTx(): Promise<Transaction>;
}