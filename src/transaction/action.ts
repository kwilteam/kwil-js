import { Kwil } from '../client/kwil';
import { ActionInput } from '../core/action';
import { SignerSupplier } from '../core/signature';
import { BytesEncodingStatus, EnvironmentType, PayloadType, ValueType } from '../core/enums';
import { Message } from '../core/message';
import { EncodedValue, UnencodedActionPayload } from '../core/payload';
import { AnySignatureType, Signature } from '../core/signature';
import { Transaction } from '../core/tx';
import { PayloadTx } from './payloadTx';
import { PayloadMsg } from '../message/payloadMsg';
import { objects } from '../utils/objects';
import { encodeNestedArguments } from '../utils/rlp';

export interface ActionOptions {
  actionName: string;
  namespace: string;
  chainId: string;
  description: string;
  actionInputs: ActionInput[];
  signer?: SignerSupplier;
  identifier?: Uint8Array;
  signatureType?: AnySignatureType;
  nonce?: number;
  challenge?: string;
  signature?: Signature<BytesEncodingStatus.BASE64_ENCODED>;
}

interface CheckSchema {
  dbid: string;
  actionName: string;
  preparedActions: EncodedValue[][];
  modifiers?: ReadonlyArray<string>;
}

interface ExecSchema {
  name: string;
  public: boolean;
  parameters: ReadonlyArray<string>;
  modifiers: ReadonlyArray<string>;
}

const TXN_BUILD_IN_PROGRESS: ActionInput[] = [];

/**
 * `Action` class creates a transaction to execute database actions on the Kwil network.
 */
export class Action<T extends EnvironmentType> {
  public kwil: Kwil<T>;
  public actionName: string;
  public namespace: string;
  public chainId: string;
  public description: string;
  public actionInputs: ActionInput[];
  public signer?: SignerSupplier;
  public identifier?: Uint8Array;
  public signatureType?: AnySignatureType;
  public nonce?: number;
  public challenge?: string;
  public signature?: Signature<BytesEncodingStatus.BASE64_ENCODED>;

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
    const { dbid, actionName, preparedActions, modifiers } = await this.checkSchema(cached);

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
    if (modifiers && modifiers.includes('VIEW')) {
      throw new Error(
        `Action / Procedure ${actionName} is a 'view' action. Please use kwil.call().`
      );
    }

    // construct payload
    const payload: UnencodedActionPayload<PayloadType.EXECUTE_ACTION> = {
      namespace: this.namespace,
      action: actionName,
      arguments: preparedActions,
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
  async buildMsg(): Promise<Message> {
    this.assertNotBuilding();

    // cache the action
    const cached = this.actionInputs;

    // set the actions to a special value to indicate that the message is being built
    this.actionInputs = TXN_BUILD_IN_PROGRESS;

    // retrieve the schema and run validations
    const { dbid, actionName, preparedActions, modifiers } = await this.checkSchema(cached);

    // throw a runtime error if more than one set of inputs is trying to be executed. Call does not allow bulk execution.
    if (preparedActions && preparedActions.length > 1) {
      throw new Error(
        'Cannot pass more than one input to the call endpoint. Please pass only one input and try again.'
      );
    }

    // throw runtime error if action is not a view action. transactions require a different payload structure than view actions.
    if (modifiers && modifiers.includes('VIEW') === false) {
      throw new Error(`Action ${actionName} is not a view only action. Please use kwil.execute().`);
    }

    // construct payload. If there are no prepared actions, then the payload is an empty array.
    const payload: UnencodedActionPayload<PayloadType.CALL_ACTION> = {
      namespace: dbid,
      action: actionName,
      // if there are prepared actions, then the first element in the array is the action inputs.
      arguments: preparedActions.length > 0 ? preparedActions[0] : [],
      // if there are nilArgs, then the first element in the array is the nilArgs.
    };

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
      (msg.signer = this.signer),
        (msg.signatureType = this.signatureType!),
        (msg.identifier = this.identifier!);
    }

    return await msg.buildMsg().finally(() => (this.actionInputs = cached));
  }

  /**
   * Checks the schema and validates the actions.
   *
   * @param {ActionInput[]} actions - The values of the actions to be executed.
   * @returns {CheckSchema} - An object containing the database identifier, action name, action schema, and prepared actions.
   */
  private async checkSchema(actions: ActionInput[]): Promise<CheckSchema> {
    // TODO: Needs to be refactored to check schema in way
    // retrieve the schema for the database
    // const schema = await this.kwil.getSchema(this.dbid);
    // // throw an error if the schema does not have any actions.
    // if (!schema?.data?.actions && !schema.data?.procedures) {
    //   throw new Error(
    //     `Could not retrieve actions or procedures for database ${this.dbid}. Please double check that you have the correct DBID.`
    //   );
    // }
    // // validate the the name exists on the schema.
    // const actionSchema = schema.data.actions?.find((a) => a.name === this.actionName);
    // const procedureSchema = schema.data.procedures?.find((p) => p.name === this.actionName);
    // const foundActionOrProcedure = actionSchema || procedureSchema;
    // if (!foundActionOrProcedure) {
    //   throw new Error(
    //     `Could not find action or procedure ${this.actionName} in database ${this.dbid}. Please double check that you have the correct DBID and action name.`
    //   );
    // }
    // const validated = objects.validateRequiredFields(foundActionOrProcedure, ['name', 'public']);
    // const execSchema: ExecSchema = {
    //   name: validated.name,
    //   public: validated.public,
    //   ...(actionSchema
    //     ? {
    //         // if we have reached this point and actionSchema is not null, then we know that procedureSchema is null.
    //         parameters: actionSchema.parameters,
    //         modifiers: actionSchema.modifiers,
    //       }
    //     : {
    //         // if we have reached this point and actionSchema is not null, then we know that procedureSchema is not null.
    //         parameters: procedureSchema?.parameters?.map((p) => p.name) || [],
    //         modifiers: procedureSchema?.modifiers || [],
    //       }),
    // };
    // if (actions) {
    //   // ensure that no action inputs or values are missing
    //   const preparedActions = this.prepareActions(actions, execSchema, this.actionName);
    //   return {
    //     dbid: this.dbid,
    //     actionName: this.actionName,
    //     modifiers: execSchema.modifiers,
    //     preparedActions,
    //   };
    // }
    // return {
    //   dbid: this.dbid,
    //   actionName: this.actionName,
    //   modifiers: execSchema.modifiers,
    //   preparedActions: [],
    // };
  }

  /**
   * Validates that the action is not missing any inputs.
   *
   * @param {ActionInput[]} actions - The values of the actions to be executed.
   * @param {ExecSchema} execSchema - The schema of the action to be executed.
   * @param {string} actionName - The name of the action to be executed.
   * @returns {ValueType[][]} - An array of arrays of values to be executed.
   */
  private prepareActions(
    actions: ActionInput[],
    execSchema: ExecSchema,
    actionName: string
  ): EncodedValue[][] {
    // if action does not require parameters, return an empty array
    if ((!execSchema.parameters || execSchema.parameters.length === 0) && actions.length === 0) {
      return [];
    }

    // throw runtime error if action does not have any parameters but inputs were provided
    if (!execSchema.parameters || execSchema.parameters.length === 0) {
      throw new Error(`No parameters found for action schema: ${actionName}.`);
    }

    // throw runtime error if no actions were provided but inputs are required
    if (actions.length == 0) {
      throw new Error('No action data has been added to the ActionBuilder.');
    }

    // track the missing actions
    const missingActions = new Set<string>();
    execSchema.parameters.forEach((p) => {
      const found = actions.find((a) => {
        return a.containsKey && a.containsKey(p);
      });

      if (!found) {
        missingActions.add(p);
      }
    });

    if (missingActions.size > 0) {
      throw new Error(`Actions do not match action schema inputs: ${Array.from(missingActions)}`);
    }

    const preparedActions: ValueType[][] = [];
    const missingInputs = new Set<string>();
    actions.forEach((a) => {
      const copy = ActionInput.from(a);
      execSchema.parameters?.forEach((p) => {
        if (missingInputs.has(p)) {
          return;
        }

        if (!copy.containsKey(p)) {
          missingInputs.add(p);
          return;
        }

        if (missingInputs.size > 0) {
          return;
        }

        const val = copy.get(p);

        copy.put(p, val);
      });

      if (missingInputs.size === 0) {
        execSchema.parameters &&
          preparedActions.push(
            execSchema.parameters.map((p) => {
              const val = copy.get(p);
              return val;
            })
          );
      }
    });

    if (missingInputs.size > 0) {
      throw new Error(`Inputs are missing for actions: ${Array.from(missingInputs)}`);
    }

    return encodeNestedArguments(preparedActions);
  }

  private assertNotBuilding(): void {
    if (this.actionInputs === TXN_BUILD_IN_PROGRESS) {
      throw new Error('Cannot modify the builder while a transaction is being built.');
    }
  }
}
