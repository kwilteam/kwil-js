import {NonNil, Promisy} from "../utils/types";
import { Transaction } from "./tx";
import {ethers, Signer as _Signer} from "ethers";
import {ActionInput} from "./actionInput";
import {Wallet as Walletv5, Signer as Signerv5} from "ethers5";
import { PayloadType } from "./enums";
import { Message } from "./message";

export type Signer = NonNil<_Signer | ethers.Wallet | Walletv5 | Signerv5>;
export type SignerSupplier = Promisy<Signer>

export interface TxnBuilder {
    payloadType(payloadType: NonNil<PayloadType>): NonNil<TxnBuilder>;

    signer(signer: SignerSupplier): NonNil<TxnBuilder>;

    payload(payload: (() => NonNil<object>) | NonNil<object>): NonNil<TxnBuilder>;

    buildTx(): Promise<Transaction>;

    buildMsg(): Promise<Message>;
}

export interface DBBuilder {
    /**
     * Sets the signer for the database transaction.
     * 
     * @param signer - The signer for the database transaction. This must be a valid Ethereum signer from Ethers v5 or Ethers v6.
     * @returns The current `DBBuilder` instance for chaining.
     */

    signer(signer: SignerSupplier): NonNil<DBBuilder>;

    /**
     * Sets the database JSON payload for the database transaction.
     * 
     * @param payload - The payload for the database transaction. This must be a valid JSON from compiled Kuneiform. See Kwil docs for more info.
     * @returns The current `DBBuilder` instance for chaining.
     */

    payload(payload: (() => NonNil<object>) | NonNil<object>): NonNil<DBBuilder>;

    /**
     * Builds a database transaction.
     * 
     * @returns A promise that resolves to a Transaction object. This transaction can be broadcasted to the Kwil network.
     */

    buildTx(): Promise<Transaction>;
}

export interface ActionBuilder {
    /**
     * Sets the name of the action to be executed. This must be an action that is defined in the database schema for the given DBID.
     * 
     * @param actionName - The name of the action.
     * @returns The current `ActionBuilder` instance for chaining.
     * @throws Will throw an error if the action is being built.
     */

    name(actionName: string): NonNil<ActionBuilder>;

    /**
     * Sets the database identifier (DBID) of the database that contains the action to be executed.
     * 
     * @param dbid - The database identifier.
     * @returns The current `ActionBuilder` instance for chaining.
     * @throws Will throw an error if the action is being built.
     */

    dbid(dbid: string): NonNil<ActionBuilder>;

    /**
     * Concatenates the provided actionInputs to the list of inputs to be executed in the action transaction.
     * 
     * @param actions - The actions to concatenate. This should be from the `ActionInput` class.
     * @returns The current `ActionBuilder` instance for chaining.
     * @throws Will throw an error if the action is being built.
     */
    
    concat(action: ActionInput | ActionInput[]): NonNil<ActionBuilder>;

    /**
     * Sets the signer for the action transaction.
     * 
     * @param signer - The signer for the action. This must be a valid Ethereum signer from Ethers v5 or Ethers v6.
     * @returns The current `ActionBuilder` instance for chaining.
     * @throws Will throw an error if the action is being built.
     */

    signer(signer: SignerSupplier): NonNil<ActionBuilder>;

    /**
     * Builds a transaction.
     * 
     * @returns A promise that resolves to a Transaction object. This transaction can be broadcasted to the Kwil network.
     * @throws Will throw an error if the action is being built or if there's an issue with the schema retrieval for validating the action.
     */

    buildTx(): Promise<Transaction>;

    /**
     * Builds a message.
     * 
     * @returns A promise that resolves to a Message object. This message can be sent to the Kwil network with the kwil.call() api.
     * @throws Will throw an error if the action is being built or if there's an issue with the schema retrieval for validating the action.
     */

    buildMsg(): Promise<Message>;
}