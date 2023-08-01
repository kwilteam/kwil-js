import {NonNil, Promisy} from "../utils/types";
import {PayloadType, Transaction} from "./tx";
import {ethers, Signer as _Signer} from "ethers";
import {ActionInput} from "./actionInput";
import {Wallet as Walletv5, Signer as Signerv5} from "ethers5";
import { GenericResponse } from "./resreq";

export type Signer = NonNil<_Signer | ethers.Wallet | Walletv5 | Signerv5>;
export type SignerSupplier = Promisy<Signer>

export interface TxnBuilder {
    payloadType(payloadType: NonNil<PayloadType>): NonNil<TxnBuilder>;

    signer(signer: SignerSupplier): NonNil<TxnBuilder>;

    payload(payload: (() => NonNil<object>) | NonNil<object>): NonNil<TxnBuilder>;

    buildTx(): Promise<Transaction>;


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
}

export interface ReadActionBuilder {
    /**
     * Sets the name of the read-only actyion to be called. This must be an action that is defined in the database schema for the given DBID.
     * @param actionName - The name of the read-only action.
     * @returns The current `ReadActionBuilder` instance for chaining.
     */
    name(actionName: string): NonNil<ReadActionBuilder>;

    /**
     * Sets the database identifier (DBID) of the database that contains the read-only action to be called.
     * @param dbid - The database identifier.
     * @returns The current `ReadActionBuilder` instance for chaining.
     */
    dbid(dbid: string): NonNil<ReadActionBuilder>;

    /**
     * Sets the signer for the read-only action, if a signer is required.
     * @param signer - The signer for the read-only action. This must be a valid Ethereum signer from Ethers v5 or Ethers v6.
     * @returns The current `ReadActionBuilder` instance for chaining.
     */
    signer(signer: SignerSupplier): NonNil<ReadActionBuilder>;

    /**
     * Concatenates the provided parameters to the list of parameters to be called in the read-only action.
     * @param params - The parameters to concatenate. This should be a map of key-value pairs.
     * @returns The current `ReadActionBuilder` instance for chaining.
    */
    concat(params: Map<string, string>): NonNil<ReadActionBuilder>;

    /**
     * Builds a read-only action and sends the request to the read-only endpoint.
     * @returns A promise that resolves to the response of the read-only action, if a valid response exists.
     */
    buildAndRequest(): Promise<GenericResponse<string>>;
}