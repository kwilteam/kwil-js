import { HexString, Nillable, NonNil, Promisy } from '../utils/types';
import { Transaction } from './tx';
import { ActionInput } from './action';
import { DeployOrDrop, PayloadType } from './enums';
import { Message } from './message';
import { AnySignatureType } from './signature';
import { DbPayloadType } from './payload';

// Eth Signer is any class with a signMessage() method. This is supported by Ethers v5 and Ethers v6.
export type EthSigner = {
  signMessage: (message: string | Uint8Array) => Promise<string>;
};

export type CustomSigner = NonNil<(message: Uint8Array, ...args: any[]) => Promise<Uint8Array>>;
export type SignerSupplier = Promisy<EthSigner | CustomSigner>;

/**
 * `PayloadBuilder` is the interface for building transactions and messages that are sent over GRPC to a Kwil network.
 */
export interface PayloadBuilder {
  /**
   * Specify the payload type to be built.
   *
   * @param {PayloadType} payloadType - The payload type to be built. See {@link PayloadType} for more information.
   * @returns {PayloadBuilder} - The current `PayloadBuilder` instance for chaining.
   * @throws {Error} - If the payload type is null or undefined.
   */
  payloadType(payloadType: NonNil<PayloadType>): NonNil<PayloadBuilder>;

  /**
   * Specify the signer and the signature type.
   *
   * @param {SignerSupplier} signer - The signer to be used to sign the transaction.
   * @param {AnySignatureType} sigType - The signature type to be used to sign the transaction. See {@link AnySignatureType} for more information.
   * @returns The current `PayloadBuilder` instance for chaining.
   * @throws {Error} - If the signer is null or undefined.
   * @throws {Error} - If the signature type is null or undefined.
   */
  signer(signer: SignerSupplier, sigType: AnySignatureType): NonNil<PayloadBuilder>;

  /**
   * Specifies the identifier (e.g. wallet, public key, etc) for the payload signer.
   *
   * @param {HexString | Uint8Array} identifier - The identifier to be used to sign the transaction. This can be a hex string or a Uint8Array.
   * @returns {PayloadBuilder} - The current `PayloadBuilder` instance for chaining.
   * @throws {Error} - If the identifier is null or undefined.
   */
  publicKey(identifier: HexString | Uint8Array): NonNil<PayloadBuilder>;

  /**
   * Set the description to be included in the payload signature.
   *
   * @param {string | null} description - The description to be included in the payload signature.
   * @returns {PayloadBuilder} - The current `PayloadBuilder` instance for chaining.
   */
  description(description: Nillable<string>): NonNil<PayloadBuilder>;

  /**
   * Sets the content for the body of the payload object.
   *
   * @param {() => NonNil<AllPayloads> | NonNil<AllPayloads>} payload - The payload to be built. This can be a function that returns an object or an object.
   * @returns {PayloadBuilder} - The current `PayloadBuilder` instance for chaining.
   * @throws {Error} - If the payload is null or undefined.
   */
  payload(payload: (() => NonNil<object>) | NonNil<object>): NonNil<PayloadBuilder>;

  /**
   * Specifies the chain ID for the network being used.
   *
   * @param {string} chainId - The chain ID for the network being used.
   * @returns {PayloadBuilder} The current `PayloadBuilder` instance for chaining.
   */
  chainId(chainId: string): NonNil<PayloadBuilder>;

  /**
   * Specifies the nonce for the transaction. If this is not specified, the nonce will be retrieved from the Kwil network.
   *
   * @param {number} nonce - The nonce for the transaction.
   * @returns {PayloadBuilder} The current `PayloadBuilder` instance for chaining.
   */
  nonce(nonce: number): NonNil<PayloadBuilder>;

  /**
   * Builds the payload for the `kwil.broadcast()` method (i.e. the broadcast GRPC endpoint - see {@link https://github.com/kwilteam/proto/blob/main/kwil/tx/v1/broadcast.proto})
   *
   * @returns {BaseTransaction} - A promise that resolves to the signed transaction.
   * @throws {Error} - If the required fields in the builder are null or undefined.
   */
  buildTx(): Promise<Transaction>;

  /**
   * Build the payload structure for message to the `kwil.call()` method (i.e. the call GRPC endpoint - see {@link https://github.com/kwilteam/proto/blob/main/kwil/tx/v1/call.proto})
   *
   * @returns {Message} - A promise that resolves to the built message, with signature if provided.
   * @throws {Error} - If the required fields in the builder are null or undefined.
   */
  buildMsg(): Promise<Message>;
}

/**
 * `DBBuilder` is the interface for building database deployment and database drop transactions.
 */
export interface DBBuilder<T extends DeployOrDrop> {
  /**
   * Specify the signer for the action operation.
   *
   * @param {EthSigner} signer - The signer for the database operation. This must be a signer from Ethers v5 or Ethers v6.
   * @returns {DBBuilder} The current `ActionBuilder` instance for chaining.
   * @throws Will throw an error if the action is being built.
   * @throws Will throw an error if the signer is null or undefined.
   * @throws Will throw an error if it cannot infer the signature type from the signer.
   */
  signer(signer: EthSigner): NonNil<DBBuilder<T>>;

  /**
   * Specify the signer for the action operation.
   *
   * @param {CustomSigner} signer - The signer for the database operation. This must be a custom signer function of the form `(message: Uint8Array, ...args: any[]) => Promise<Uint8Array>`.
   * @param {AnySignatureType} signatureType - The signature type for the database operation. This can be a `SignatureType` enum value or a string for a network-specific signature type, if implemented at the network level.
   * @returns {DBBuilder} The current `ActionBuilder` instance for chaining.
   * @throws Will throw an error if the action is being built.
   * @throws Will throw an error if the signer is null or undefined.
   * @throws Will throw an error if the signature type is null or undefined.
   */
  signer(signer: CustomSigner, signatureType: AnySignatureType): NonNil<DBBuilder<T>>;

  /**
   * Specifies the signer for the database transaction.
   *
   * @param {SignerSupplier} signer - The signer for the database transaction. This can be a `Signer` from Ethers v5 or Ethers v6 or a custom signer function. Custom signers must be of the form `(message: Uint8Array, ...args: any[]) => Promise<Uint8Array>`.
   * @param {AnySignatureType} signatureType - The signature type for the database transaction. This is only required if the signer is a custom signer function.
   * @returns {DBBuilder} The current `DBBuilder` instance for chaining.
   * @throws Will throw an error if the signer is null or undefined.
   * @throws Will throw an error if the signature type is null or undefined.
   * @throws Will throw an error if it cannot infer the signature type from the signer.
   */
  signer(signer: SignerSupplier, signatureType?: AnySignatureType): NonNil<DBBuilder<T>>;

  /**
   * The payload for the database deployment or database drop.
   *
   * @param {DbPayloadType<T>} payload - The payload for the database deployment or database drop. This should be a callback function that resolves to either a `CompiledKuneiform` or `DropDbPayload` object, or just objects that match either of those interfaces.
   * @returns {DBBuilder} The current `DBBuilder` instance for chaining.
   * @throws Will throw an error if the payload is null or undefined.
   */
  payload(payload: DbPayloadType<T>): NonNil<DBBuilder<T>>;

  /**
   * Specifies the identifier (e.g. wallet, public key, etc) for the database deployment / drop.
   *
   * @param {string | Uint8Array} identifier - The identifier for the database deployment / drop.
   * @returns {DBBuilder} The current `DBBuilder` instance for chaining.
   * @throws Will throw an error if the identifier is null or undefined.
   */
  publicKey(identifier: HexString | Uint8Array): NonNil<DBBuilder<T>>;

  /**
   * Specifies the chain ID for the network being used.
   *
   * @param {string} chainId - The chain ID for the network being used.
   * @returns {DBBuilder} The current `DBBuilder` instance for chaining.
   */
  chainId(chainId: string): NonNil<DBBuilder<T>>;

  /**
   * Specifies the descriptions to be included in the message that is signed.
   *
   * @param {string} description - The description to be included in the message that is signed.
   * @returns {DBBuilder} The current `DBBuilder` instance for chaining.
   * @throws Will throw an error if the description is null or undefined.
   */
  description(description: string): NonNil<DBBuilder<T>>;

  /**
   * Specifies the nonce for the transaction. If this is not specified, the nonce will be retrieved from the Kwil network.
   *
   * @param {number} nonce - The nonce for the transaction.
   * @returns {DBBuilder} The current `DBBuilder` instance for chaining.
   */
  nonce(nonce: number): NonNil<DBBuilder<T>>;

  /**
   * Builds a Transaction. This will call the kwil network to retrieve the nonce for the signer.
   *
   * @returns {Promise<Transaction>} - A promise that resolves to a `Transaction` object. The `Transaction` object can be broadcasted to the Kwil network using `kwil.broadcast(tx)`.
   * @throws Will throw an error if there are any errors in the payload.
   * @throws Will throw an error if there is an issue with the account retrieval.
   */
  buildTx(): Promise<Transaction>;
}

/**
 * `ActionBuilder` is the interface for building `update` action transactions and `view` actions messages.
 */
export interface ActionBuilder {
  /**
   * Specifies the name of the action to be executed.
   *
   * @param {string} actionName - The name of the action to be executed.
   * @returns {ActionBuilder} The current `ActionBuilder` instance for chaining.
   * @throws Will throw an error if the value is specified while the action is being built.
   * @throws Will throw an error if the action name is null or undefined.
   */
  name(actionName: string): NonNil<ActionBuilder>;

  /**
   * Specifies the database identifier (DBID) of the database that contains the action to be executed.
   *
   * @param {string} dbid - The database identifier.
   * @returns {ActionBuilder} The current `ActionBuilder` instance for chaining.
   * @throws Will throw an error if the value is specified while the action is being built.
   * @throws Will throw an error if the dbid is null or undefined.
   */
  dbid(dbid: string): NonNil<ActionBuilder>;

  /**
   * Adds actionInputs to the list of inputs to be executed in the action.
   *
   * @param {ActionInput | ActionInput[]} actions - The actions to add. This should be from the `ActionInput` class.
   * @returns The current `ActionBuilder` instance for chaining.
   * @throws Will throw an error if the value is specified while the action is being built.
   * @throws Will throw an error if the action is null or undefined.
   */
  concat(action: ActionInput | ActionInput[]): NonNil<ActionBuilder>;

  /**
   * Specify the signer for the action operation.
   *
   * @param {EthSigner} signer - The signer for the database operation. This must be a signer from Ethers v5 or Ethers v6.
   * @returns {ActionBuilder} The current `ActionBuilder` instance for chaining.
   * @throws Will throw an error if the action is being built.
   * @throws Will throw an error if the signer is null or undefined.
   * @throws Will throw an error if it cannot infer the signature type from the signer.
   */
  signer(signer: EthSigner): NonNil<ActionBuilder>;

  /**
   * Specify the signer for the action operation.
   *
   * @param {CustomSigner} signer - The signer for the database operation. This must be a custom signer function of the form `(message: Uint8Array, ...args: any[]) => Promise<Uint8Array>`.
   * @param {AnySignatureType} signatureType - The signature type for the database operation. This can be a `SignatureType` enum value or a string for a network-specific signature type, if implemented at the network level.
   * @returns {ActionBuilder} The current `ActionBuilder` instance for chaining.
   * @throws Will throw an error if the action is being built.
   * @throws Will throw an error if the signer is null or undefined.
   * @throws Will throw an error if the signature type is null or undefined.
   */
  signer(signer: CustomSigner, signatureType: AnySignatureType): NonNil<ActionBuilder>;

  /**
   * Specifies the signer for the action operation.
   *
   * @param {SignerSupplier} signer - The signer for the database operation. This can be a signer from Ethers v5 or Ethers v6 or a custom signer function of the form `(message: Uint8Array, ...args: any[]) => Promise<Uint8Array>`.
   * @param {AnySignatureType} signatureType - The signature type for the database operation. This can be a `SignatureType` enum value or a string for a network-specific signature type. Ethers v5 and Ethers v6 signers will have the signature type inferred from the signer.
   * @returns {ActionBuilder} The current `ActionBuilder` instance for chaining.
   * @throws Will throw an error if the action is being built.
   * @throws Will throw an error if the signer is null or undefined.
   * @throws Will throw an error if the signature type is null or undefined.
   * @throws Will throw an error if it cannot infer the signature type from the signer.
   */

  signer(signer: SignerSupplier, signatureType?: AnySignatureType): NonNil<ActionBuilder>;

  /**
   * Specifies the identifier (e.g. wallet, public key, etc) of the signer for the action.
   *
   * @param {HexString | Uint8Array} identifier - The identifier of the wallet signing for the database operation.
   * @returns {ActionBuilder} The current `ActionBuilder` instance for chaining.
   * @throws Will throw an error if the value is specified while the action is being built.
   * @throws Will throw an error if the identifier is null or undefined.
   */
  publicKey(identifier: HexString | Uint8Array): NonNil<ActionBuilder>;

  /**
   * Specifies the description to be included in the message that is signed.
   *
   * @param {string} description - The description to be included in the message that is signed.
   * @returns {ActionBuilder} The current `ActionBuilder` instance for chaining.
   * @throws Will throw an error if the value is specified while the action is being built.
   * @throws Will throw an error if the description is null or undefined.
   */
  description(description: string): NonNil<ActionBuilder>;

  /**
   * Specifies the chain ID for the network being used.
   *
   * @param {string} chainId - The chain ID for the network being used.
   * @returns {ActionBuilder} The current `ActionBuilder` instance for chaining.
   */
  chainId(chainId: string): NonNil<ActionBuilder>;

  /**
   * Specifies the nonce for the transaction. If this is not specified, the nonce will be retrieved from the Kwil network.
   *
   * @param {number} nonce - The nonce for the transaction.
   * @returns {ActionBuilder} The current `ActionBuilder` instance for chaining.
   */
  nonce(nonce: number): NonNil<ActionBuilder>;

  /**
   * Builds a transaction. This will call the kwil network to retrieve the schema and the signer's account.
   *
   * @returns {Promise<BaseTransaction>} - A promise that resolves to a Transaction object. This transaction can be broadcasted to the Kwil network with the `kwil.broadcast()` api.
   * @throws Will throw an error if the action is being built or if there's an issue with the schema or account retrieval.
   * @throws Will throw an error if the action is not a update action.
   */
  buildTx(): Promise<Transaction>;

  /**
   * Builds the message structure for view actions. This can be provided to the `kwil.call()` api.
   *
   * @returns {Promise<Message>} - A message object that can be sent to the Kwil network.
   * @throws Will throw an error if the action is being built or if there's an issue with the schema or account retrieval.
   * @throws Will throw an error if the action is not a view action.
   */
  buildMsg(): Promise<Message>;
}
