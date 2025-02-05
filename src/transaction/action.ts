import { Kwil } from '../client/kwil';
import { ActionOptions, NamedParams, NamespaceAction, ValidatedAction } from '../core/action';
import { SignerSupplier } from '../core/signature';
import {
  AccessModifier,
  EnvironmentType,
  PayloadType,
} from '../core/enums';
import { Message } from '../core/message';
import { EncodedValue, UnencodedActionPayload } from '../core/payload';
import { AnySignatureType } from '../core/signature';
import { Transaction } from '../core/tx';
import { PayloadTx } from './payloadTx';
import { PayloadMsg } from '../message/payloadMsg';
import { objects } from '../utils/objects';
import { encodeActionInputs } from '../utils/parameterEncoding';
import { Base64String } from '../utils/types';

const TXN_BUILD_IN_PROGRESS: NamedParams[] = [];

/**
 * `Action` class creates a transaction to execute database actions on the Kwil network.
 */
export class Action<T extends EnvironmentType> {
  public kwil: Kwil<T>;
  public actionName: string;
  public namespace: string;
  public chainId: string;
  public description: string;
  public actionInputs: NamedParams[];
  public signer?: SignerSupplier;
  public identifier?: Uint8Array;
  public signatureType?: AnySignatureType;
  public nonce?: number;
  public challenge?: string;
  public signature?: Base64String;

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
  async buildTx(privateMode: boolean): Promise<Transaction> {
    this.assertNotBuilding();

    // cache the action inputs
    const cachedActionInputs = this.actionInputs;

    // set the actions to a special value to indicate that the transaction is being built
    this.actionInputs = TXN_BUILD_IN_PROGRESS;

    const payload = await this.buildTxPayload(privateMode, cachedActionInputs);

    // throw runtime error if signer is null or undefined
    const { signer, identifier, signatureType } = objects.validateFields(
      {
        signer: this.signer,
        identifier: this.identifier,
        signatureType: this.signatureType,
      },
      (fieldName: string) => `${fieldName} is required to build a transaction.`
    );

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
      .finally(() => (this.actionInputs = cachedActionInputs));
  }

  /**
   * Builds the message structure for view actions. This can be provided to the `kwil.call()` api.
   */
  async buildMsg(privateMode: boolean): Promise<Message> {
    this.assertNotBuilding();

    // cache the action inputs
    const cachedActionInputs = this.actionInputs;

    // set the actions to a special value to indicate that the message is being built
    this.actionInputs = TXN_BUILD_IN_PROGRESS;

    const payload = await this.buildMsgPayload(privateMode, cachedActionInputs);

    // build message
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

    return await msg.buildMsg().finally(() => (this.actionInputs = cachedActionInputs));
  }

  /**
   * Builds the payload for the execute action.
   *
   * @param {boolean} privateMode - Whether the action is being executed in private mode.
   * @param {ActionInput[]} actionInputs - The inputs for the action.
   * @returns {UnencodedActionPayload<PayloadType.EXECUTE_ACTION>} - The payload for the execute action.
   */
  private async buildTxPayload(
    privateMode: boolean,
    actionInputs: NamedParams[]
  ): Promise<UnencodedActionPayload<PayloadType.EXECUTE_ACTION>> {
    const payload: UnencodedActionPayload<PayloadType.EXECUTE_ACTION> = {
      dbid: this.namespace,
      action: this.actionName,
      arguments: [],
    };

    // In private mode, we cannot validate the action inputs as we cannot run the selectQuery to get the schema.
    if (privateMode) {
      for (const actionInput of actionInputs) {
        payload.arguments.push(encodeActionInputs(Object.values(actionInput)));
      }

      return payload;
    }

    // retrieve the schema and run validations
    const { actionName, encodedActionInputs, modifiers } = await this.validatedActionRequest(
      actionInputs
    );

    // throw runtime error if action is a view action. view actions require a different payload structure than transactions.
    if (modifiers && modifiers.includes(AccessModifier.VIEW)) {
      throw new Error(
        `Action / Procedure ${actionName} is a 'view' action. Please use kwil.call().`
      );
    }

    payload.arguments = encodedActionInputs;

    return payload;
  }

  /**
   * Builds the payload for the call action.
   *
   * @param {boolean} privateMode - Whether the action is being executed in private mode.
   * @param {ActionInput[]} actionInputs - The inputs for the action.
   * @returns {UnencodedActionPayload<PayloadType.CALL_ACTION>} - The payload for the call action.
   */
  private async buildMsgPayload(
    privateMode: boolean,
    actionInputs: NamedParams[]
  ): Promise<UnencodedActionPayload<PayloadType.CALL_ACTION>> {
    const payload: UnencodedActionPayload<PayloadType.CALL_ACTION> = {
      dbid: this.namespace,
      action: this.actionName,
      arguments: [],
    };

    // In private mode, we cannot validate the action inputs as we cannot run the selectQuery to get the schema.
    if (privateMode) {
      const actionValues = actionInputs.length > 0 ? Object.values(actionInputs[0]) : [];
      payload.arguments = encodeActionInputs(actionValues);

      return payload;
    }

    // If we have access to the schema, we can validate the action inputs
    const { actionName, encodedActionInputs, modifiers } = await this.validatedActionRequest(
      actionInputs
    );

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
    payload.arguments = encodedActionInputs[0];

    return payload;
  }

  /**
   * Checks the action definition and validates the action inputs
   *
   * @param {ActionInput[]} actionInputs - An array of action inputs to be executed.
   * @returns {ValidatedAction} - An object containing the database namespace, action name, modifiers, and encoded action inputs.
   */
  private async validatedActionRequest(actionInputs: NamedParams[]): Promise<ValidatedAction> {
    // retrieve the schema for the database
    const namespaceRequest = await this.kwil.getActions(this.namespace);

    // Check if the request was successful
    if (namespaceRequest.status !== 200) {
      throw new Error(
        `Failed to retrieve actions for namespace ${this.namespace}. Status: ${namespaceRequest.status}`
      );
    }

    // Check if namespace has actions
    if (!namespaceRequest.data || namespaceRequest.data.length === 0) {
      throw new Error(
        `No actions found for the namespace '${this.namespace}'. Please verify the namespace exists and contains the '${this.actionName}' action.`
      );
    }

    const namespaceActions = namespaceRequest.data as NamespaceAction[];

    // Find the action matching the requested name
    const selectedAction = namespaceActions.find((a) => a.name === this.actionName);
    if (!selectedAction) {
      throw new Error(`Action '${this.actionName}' not found in namespace '${this.namespace}'.`);
    }

    // Validate that the action is public
    if (!selectedAction.access_modifiers.includes(AccessModifier.PUBLIC)) {
      throw new Error(`Action '${this.actionName}' is not a public action.`);
    }

    // ensure that no action inputs or values are missing
    if (actionInputs) {
      for (const actionInput of actionInputs) {
        if (!this.validateActionInputs(selectedAction, actionInput)) {
          // Should not reach this point as error is thrown in validateActionInputs
          throw new Error(`Action inputs are invalid for action: ${selectedAction.name}.`);
        }
      }

      const encodedActionInputs: EncodedValue[][] = [];
      for (const actionInput of actionInputs) {
        encodedActionInputs.push(encodeActionInputs(Object.values(actionInput)));
      }

      return {
        actionName: selectedAction.name,
        modifiers: selectedAction.access_modifiers,
        encodedActionInputs,
      };
    }

    return {
      actionName: selectedAction.name,
      modifiers: selectedAction.access_modifiers,
      encodedActionInputs: [],
    };
  }

  /**
   * Validates that the action is not missing any inputs.
   *
   * @param {NamespaceAction} selectedAction - The schema of the action to be executed.
   * @param {ActionInput} actionInput - The values of the actions to be executed.
   * @returns {boolean} - True if the action inputs are valid, false otherwise.
   */
  private validateActionInputs(
    selectedAction: NamespaceAction,
    actionInputEntries: NamedParams
  ): boolean {
    const actionInputKeys = Object.keys(actionInputEntries);

    // if action does not require parameters, return true
    if (
      (!selectedAction.parameter_names || selectedAction.parameter_names.length === 0) &&
      Object.keys(actionInputEntries).length === 0
    ) {
      return true;
    }

    // throw runtime error if action does not have any parameters but inputs were provided
    if (
      (!selectedAction.parameter_names || selectedAction.parameter_names.length === 0) &&
      actionInputEntries.length !== 0
    ) {
      throw new Error(`No parameters found for action: ${this.actionName}.`);
    }

    // throw runtime error if no actionInputs were provided but are required
    if (actionInputEntries.length == 0 && selectedAction.parameter_names.length > 0) {
      throw new Error(
        `No action parameters have been included. Required parameters: ${selectedAction.parameter_names.join(
          ', '
        )}`
      );
    }

    // return true if using positional parameters
    if(Object.keys(actionInputEntries).every(key => key.startsWith('$pstn_'))) {
      return true;
    }

    // Check to see if the actionInputs match the expected selectedAction parameters
    const missingParameters = new Set<string>();
    selectedAction.parameter_names.forEach((parameterName) => {
      if (!actionInputKeys.includes(parameterName)) {
        missingParameters.add(parameterName);
      }
    });

    if (missingParameters.size > 0) {
      throw new Error(
        `Missing parameters: ${Array.from(missingParameters).join(', ')} for action '${
          selectedAction.name
        }'`
      );
    }

    const incorrectParameters = new Set<string>();
    actionInputKeys.forEach((actionInputKey) => {
      if (
        !selectedAction.parameter_names.some((parameterName) => actionInputKey === parameterName)
      ) {
        incorrectParameters.add(actionInputKey);
      }
    });

    if (incorrectParameters.size > 0) {
      throw new Error(
        `Incorrect parameters: ${Array.from(incorrectParameters).join(', ')} for action '${
          selectedAction.name
        }'`
      );
    }

    return true;
  }

  private assertNotBuilding(): void {
    if (this.actionInputs === TXN_BUILD_IN_PROGRESS) {
      throw new Error('Cannot modify the builder while a transaction is being built.');
    }
  }
}
