import { Kwil } from '../client/kwil';
import { Entries } from '../core/action';
import { SignerSupplier } from '../core/signature';
import { BytesEncodingStatus, EnvironmentType, PayloadType, VarType } from '../core/enums';
// import { Message } from '../core/message';
import { EncodedValue, UnencodedActionPayload } from '../core/payload';
import { AnySignatureType, Signature } from '../core/signature';
import { Transaction } from '../core/tx';
import { PayloadTx } from './payloadTx';
import { PayloadMsg } from '../message/payloadMsg';
import { objects } from '../utils/objects';
import ActionValidator from '../utils/actionValidator';

// TODO: Move these enums / interfaces to right place
export interface ActionOptions {
  actionName: string;
  namespace: string;
  chainId: string;
  description: string;
  actionInputs: Entries[];
  signer?: SignerSupplier;
  identifier?: Uint8Array;
  signatureType?: AnySignatureType;
  nonce?: number;
  challenge?: string;
  signature?: BytesEncodingStatus.BASE64_ENCODED;
}

export enum AccessModifier {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  VIEW = 'VIEW',
}

export interface NamespaceAction {
  name: string;
  namespace: string;
  parameter_names: ReadonlyArray<string>;
  parameter_types: ReadonlyArray<string>;
  return_names: ReadonlyArray<string>;
  return_types: ReadonlyArray<string>;
  returns_table: boolean;
  access_modifiers: ReadonlyArray<AccessModifier>;
  built_in: boolean;
  raw_statement: string;
}

export interface ValidatedAction {
  namespace: string;
  actionName: string;
  modifiers: ReadonlyArray<AccessModifier>;
  encodedActionInputs: EncodedValue[][];
}

const TXN_BUILD_IN_PROGRESS: Entries[] = [];

/**
 * `Action` class creates a transaction to execute database actions on the Kwil network.
 */
export class Action<T extends EnvironmentType> {
  public kwil: Kwil<T>;
  public actionName: string;
  public namespace: string;
  public chainId: string;
  public description: string;
  public actionInputs: Entries[];
  public signer?: SignerSupplier;
  public identifier?: Uint8Array;
  public signatureType?: AnySignatureType;
  public nonce?: number;
  public challenge?: string;
  public signature?: string;

  /**
   * Initializes a new `Action` instance.
   * It helps in building transactions to execute database actions on the Kwil network.
   *
   * @param {Kwil} kwil - The Kwil client, used to call higher-level methods on the Kwil class.
   */

  constructor(kwil: Kwil<T>, options: ActionOptions) {
    this.kwil = objects.requireNonNil(
      kwil,
      'Client is required for Action Builder. Please pass a valid Kwil Client.'
    );

    // Validate required parameters passed into Action Builder
    objects.validateRequiredFields(options, [
      'actionName',
      'namespace',
      'chainId',
      'description',
      'actionInputs',
    ]);

    this.actionName = options.actionName;
    this.namespace = options.namespace;
    this.chainId = options.chainId;
    this.description = options.description;
    this.actionInputs = options.actionInputs;

    // Validate optional parameters if passed into Action Builder
    objects.validateOptionalFields(options, [
      'signer',
      'identifier',
      'actionInputs',
      'signatureType',
      'nonce',
    ]);

    this.signer = options.signer;
    this.identifier = options.identifier;
    this.signatureType = options.signatureType;
    this.nonce = options.nonce;
    this.challenge = options.challenge;
    this.signature = options.signature;
  }

  /**
   * Static factory method to create a new Action instance.
   *
   * @param kwil - The Kwil client.
   * @param options - The options to configure the Action instance.
   */
  static createTx<T extends EnvironmentType>(kwil: Kwil<T>, options: ActionOptions): Action<T> {
    return new Action<T>(kwil, options);
  }
  /**
   * Build the action structure for a transaction.
   */
  async buildTx(): Promise<Transaction> {
    this.assertNotBuilding();

    // cache the action
    const cached = this.actionInputs;

    // set the actions to a special value to indicate that the transaction is being built
    this.actionInputs = TXN_BUILD_IN_PROGRESS;

    // retrieve the schema and run validations
    const { namespace, actionName, encodedActionInputs, modifiers } =
      await ActionValidator.validateActionRequest(this.namespace, this.actionName, cached);

    // throw runtime error if signer is null or undefined
    const { signer, identifier, signatureType } = objects.validateFields(
      {
        signer: this.signer,
        identifier: this.identifier,
        signatureType: this.signatureType,
      },
      (fieldName: string) => `${fieldName} is required to build a transaction.`
    );

    // throw runtime error if action is a view action. view actions require a different payload structure than transactions.
    if (modifiers && modifiers.includes(AccessModifier.VIEW)) {
      throw new Error(
        `Action / Procedure ${actionName} is a 'view' action. Please use kwil.call().`
      );
    }

    // construct payload
    const payload: UnencodedActionPayload<PayloadType.EXECUTE_ACTION> = {
      dbid: namespace,
      action: actionName,
      arguments: encodedActionInputs,
    };

    // build the transaction
    return await PayloadTx.createTx(this.kwil, {
      payloadType: PayloadType.EXECUTE_ACTION,
      payload: payload,
      signer: signer,
      signatureType: signatureType,
      description: this.description,
      chainId: this.chainId,
      identifier: identifier,
      nonce: this.nonce,
    })
      .buildTx()
      .finally(() => (this.actionInputs = cached));
  }

  /**
   * Builds the message structure for view actions. This can be provided to the `kwil.call()` api.
   */
  async buildMsg(): Promise<any> {
    this.assertNotBuilding();

    // cache the action
    const cached = this.actionInputs;

    // set the actions to a special value to indicate that the message is being built
    this.actionInputs = TXN_BUILD_IN_PROGRESS;

    // retrieve the schema and run validations
    const { namespace, actionName, encodedActionInputs, modifiers } =
      await ActionValidator.validateActionRequest(this.namespace, this.actionName, cached);

    // TODO: Should this be called before the validatedActionRequest?
    // throw a runtime error if more than one set of inputs is trying to be executed. Call does not allow bulk execution.
    if (encodedActionInputs && encodedActionInputs.length > 1) {
      throw new Error(
        'Cannot pass more than one input to the call endpoint. Please pass only one input and try again.'
      );
    }

    // throw runtime error if action is not a view action. transactions require a different payload structure than view actions.
    if (modifiers && modifiers.includes(AccessModifier.VIEW) === false) {
      throw new Error(`Action ${actionName} is not a view only action. Please use kwil.execute().`);
    }

    // construct payload. If there are no prepared actions, then the payload is an empty array.
    const payload: UnencodedActionPayload<PayloadType.CALL_ACTION> = {
      dbid: namespace,
      action: actionName,
      arguments: encodedActionInputs[0], // 'Call' method is used for 'view actions' which require only one input
    };

    // build message
    console.log('signature', this.signature);
    let msg = PayloadMsg.createMsg(payload, {
      challenge: this.challenge,
      signature: this.signature,
    });

    /**
     * if a signer is specified, add the signer, signature type, identifier, and description to the message
     * ex => if the @caller contextual variable is present in a kuneiform block for kwil.call()
     */
    if (this.signer) {
      msg.signer = this.signer;
      msg.signatureType = this.signatureType!;
      msg.identifier = this.identifier!;
    }

    return await msg.buildMsg().finally(() => (this.actionInputs = cached));
  }

  private assertNotBuilding(): void {
    if (this.actionInputs === TXN_BUILD_IN_PROGRESS) {
      throw new Error('Cannot modify the builder while a transaction is being built.');
    }
  }
}
