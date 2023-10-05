import { Nillable, NonNil, Promisy } from "../utils/types";
import { Transaction } from "./tx";
import {ethers, Signer as _Signer, JsonRpcSigner } from "ethers";
import {ActionInput} from "./actionInput";
import {Wallet as Walletv5, Signer as Signerv5} from "ethers5";
import { PayloadType } from "./enums";
import { Message } from "./message";
import { Signer as _NearSigner } from 'near-api-js'
import { AnySignatureType } from "./signature";

export type EthSigner = NonNil<_Signer | JsonRpcSigner | ethers.Wallet | Walletv5 | Signerv5 >;
export type NearSigner = NonNil<_NearSigner>;

export type CustomSigner = NonNil<(message: Uint8Array, ...args: any[]) => Promise<Uint8Array>>
export type SignerSupplier = Promisy<EthSigner | CustomSigner>

export interface TxnBuilder {
    payloadType(payloadType: NonNil<PayloadType>): NonNil<TxnBuilder>;

    signer(signer: SignerSupplier, sigType: AnySignatureType): NonNil<TxnBuilder>;

    publicKey(publicKey: string | Uint8Array): NonNil<TxnBuilder>;

    description(description: Nillable<string>): NonNil<TxnBuilder>;

    payload(payload: (() => NonNil<object>) | NonNil<object>): NonNil<TxnBuilder>;

    buildTx(): Promise<Transaction>;

    buildMsg(): Promise<Message>;
}

export interface DBBuilder {
    /**
     * Sets the signer for the database transaction.
     * 
     * @param {SignerSupplier} signer - The signer for the database transaction. This can be a `Signer` from Ethers v5 or Ethers v6 or a custom signer function. Custom signers must be of the form `(message: Uint8Array, ...args: any[]) => Promise<Uint8Array>`.
     * @param {AnySignatureType} [signatureType='secp256k1'] - The signature type for the database transaction. This is only required if the signer is a custom signer function.
     * @returns {DBBuilder} The current `DBBuilder` instance for chaining.
     */

    signer(signer: SignerSupplier, signatureType?: AnySignatureType): NonNil<DBBuilder>;

    /**
     * Sets the database JSON payload for the database transaction.
     * 
     * @param payload - The payload for the database transaction. This must be a valid JSON from compiled Kuneiform. See Kwil docs for more info.
     * @returns The current `DBBuilder` instance for chaining.
     */

    payload(payload: (() => NonNil<object>) | NonNil<object>): NonNil<DBBuilder>;

    /**
     * Set the public key for the transaction. This identifies the transaction sender.
     * This should be the public key of the signer.
     * 
     * @param publicKey - The public key for the transaction sender. Ethereum keys can be passed as a hex string (0x123...) or as bytes (Uint8Array). NEAR protocol public keys can be passed as the base58 encoded public key (with "ed25519:" prefix), a hex string, or bytes (Uint8Array).
     * @returns The current `DBBuilder` instance for chaining.
     */

    publicKey(publicKey: string | Uint8Array): NonNil<DBBuilder>;

    /**
     * Add a description for the signature message that will appear in browser wallets (e.g. Metamask, Coinbase Wallet, etc).
     * The description should be a short message that describes the transaction.
     * 
     * @param description - The description that will appear in metamask.
     * @returns The current `DBBuilder` instance for chaining.
     */
    description(description: string): NonNil<DBBuilder>;

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
     * @param signer - The signer for the database transaction. This can be a `Signer` from Ethers v5 or Ethers v6 or a custom signer function. Custom signers must be of the form `(message: Uint8Array, ...args: any[]) => Promise<Uint8Array>`.
     * @param signatureType - The signature type for the database transaction. This is only required if the signer is a custom signer function.
     * @throws Will throw an error if the action is being built.
     */

    signer(signer: SignerSupplier, signatureType?: AnySignatureType): NonNil<ActionBuilder>;

    /**
     * Set the public key for the transaction. This identifies the transaction sender.
     * This should be the public key of the signer.
     * 
     * @param publicKey - The public key for the transaction sender. Ethereum keys can be passed as a hex string (0x123...) or as bytes (Uint8Array). NEAR protocol public keys can be passed as the base58 encoded public key (with "ed25519:" prefix), a hex string, or bytes (Uint8Array).
     * @returns The current `DBBuilder` instance for chaining.
     */

    publicKey(publicKey: string | Uint8Array): NonNil<ActionBuilder>;

    /**
     * Add a description for the signature message that will appear in browser wallets (e.g. Metamask, Coinbase Wallet, etc).
     * The description should be a short message that describes the action being executed.
     * 
     * @param description - The description that will appear in metamask.
     * @returns The current `ActionBuilder` instance for chaining.
     */
    description(description: string): NonNil<ActionBuilder>;

    /**
     * Builds a transaction.
     * 
     * @returns A promise that resolves to a Transaction object. This transaction can be broadcasted to the Kwil network with the `kwil.broadcast()` api.
     * @throws Will throw an error if the action is being built or if there's an issue with the schema retrieval for validating the action.
     */

    buildTx(): Promise<Transaction>;

    /**
     * Builds a message.
     * 
     * @returns A promise that resolves to a Message object. This message can be sent to the Kwil network with the `kwil.call()` api.
     * @throws Will throw an error if the action is being built or if there's an issue with the schema retrieval for validating the action.
     */

    buildMsg(): Promise<Message>;
}