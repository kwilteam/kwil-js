import {NonNil, Promisy} from "../utils/types";
import {PayloadType, Transaction} from "./tx";
import {ethers, Signer as _Signer} from "ethers";
import {ActionInput} from "./actionInput";

export type Signer = NonNil<_Signer | ethers.Wallet>;
export type SignerSupplier = Promisy<Signer>

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

export interface ActionBuilder {
    name(actionName: string): NonNil<ActionBuilder>;

    dbid(dbid: string): NonNil<ActionBuilder>;

    concat(action: ActionInput | ActionInput[]): NonNil<ActionBuilder>;

    signer(signer: SignerSupplier): NonNil<ActionBuilder>;

    buildTx(): Promise<Transaction>;
}