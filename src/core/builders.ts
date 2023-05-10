import {NonNil} from "../utils/types";
import {PayloadType, Transaction} from "./tx";
import {ethers, JsonRpcSigner} from "ethers";

export type Signer = NonNil<JsonRpcSigner | ethers.Wallet>;
export type SignerSupplier = Signer | (() => Signer) | (() => Promise<Signer>)

export interface TxnBuilder {
    payloadType(payloadType: NonNil<PayloadType>): NonNil<TxnBuilder>;

    signer(signer: SignerSupplier): NonNil<TxnBuilder>;

    payload(payload: (() => NonNil<object>) | NonNil<object>): NonNil<TxnBuilder>;

    build(): Promise<Transaction>;
}

export interface DBBuilder {
    signer(signer: SignerSupplier): NonNil<DBBuilder>;

    payload(payload: (() => NonNil<object>) | NonNil<object>): NonNil<DBBuilder>;

    buildTx(): Promise<Transaction>;
}

type NewAction = Record<any, any>

export interface ActionBuilder {
    name(actionName: string): NonNil<ActionBuilder>;

    dbid(dbid: string): NonNil<ActionBuilder>;

    set(key: string, value: unknown): NonNil<ActionBuilder>;

    setMany(actions: Iterable<NewAction>): NonNil<ActionBuilder>;

    signer(signer: SignerSupplier): NonNil<ActionBuilder>;

    buildTx(): Promise<Transaction>;
}