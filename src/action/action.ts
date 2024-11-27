import { Kwil } from '../client/kwil';
import { ActionInput } from '../core/action';
import { SignerSupplier } from '../core/builders';
import { BytesEncodingStatus, EnvironmentType, PayloadType, ValueType } from '../core/enums';
import { Message } from '../core/message';
import { EncodedValue, UnencodedActionPayload } from '../core/payload';
import { AnySignatureType, Signature } from '../core/signature';
import { Transaction } from '../core/tx';
import { Payload } from '../payload/payload';
import { objects } from '../utils/objects';
import { encodeNestedArguments } from '../utils/rlp';
import { HexString, Nillable, Promisy } from '../utils/types';

export interface ActionOptions {
  actionName: string;
  dbid: string;
  chainId: string;
  description: string;
  signer?: SignerSupplier;
  identifier?: Uint8Array;
  actionInputs?: ActionInput[];
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
  parameters?: ReadonlyArray<string>;
  modifiers?: ReadonlyArray<string>;
}

const TXN_BUILD_IN_PROGRESS: ActionInput[] = [];

/**
 * `Action` class creates a transaction to execute database actions on the Kwil network.
 */
export class Action<T extends EnvironmentType> {
  public kwil: Kwil<T>;
  public actionName: string;
  public dbid: string;
  public chainId: string;
  public description: string;
  public signer?: SignerSupplier;
  public identifier?: Uint8Array;
  public actionInputs?: ActionInput[];
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
    objects.validateRequiredFields(options, ['actionName', 'dbid', 'chainId', 'description']);

    this.actionName = options.actionName;
    this.dbid = options.dbid;
    this.chainId = options.chainId;
    this.description = options.description;

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
    this.actionInputs = options.actionInputs;
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
    objects.requireNonNil(
      kwil,
      'client is required for DbBuilder. Please pass a valid Kwil client. This is an internal error, please create an issue.'
    );

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
      dbid: dbid,
      action: actionName,
      arguments: preparedActions,
    };

    // build the transaction
    return await Payload.createTx(this.kwil, {
      payloadType: PayloadType.EXECUTE_ACTION,
      payload: payload,
      signer: signer,
      signatureType: signatureType,
      description: this.description,
      challenge: this.challenge,
      signature: this.signature,
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
      dbid: dbid,
      action: actionName,
      // if there are prepared actions, then the first element in the array is the action inputs.
      arguments: preparedActions.length > 0 ? preparedActions[0] : [],
      // if there are nilArgs, then the first element in the array is the nilArgs.
    };

    let msg = Payload.createTx(this.kwil, {
      payload: payload,
      challenge: this.challenge,
      signature: this.signature,
    });

    // if a signer is specified, add the signer, signature type, identifier, and description to the message
    if (this.signer) {
      /**
       * assign signer to signer, signatureType to signatureType, identifier to identifier and this.description to description
       *  extend the `msg` object by adding the new properties while preserving the existing type
       */
      (msg.signer = this.signer),
        (msg.signatureType = this.signatureType),
        (msg.identifier = this.identifier),
        (msg.description = this.description);
    }

    return await msg.buildMsg().finally(() => (this.actionInputs = cached));
  }

  /**
   * Adds actionInputs to the list of inputs to be executed in the action.
   */
  concat(actions: ActionInput[] | ActionInput): Action<T> {
    this.assertNotBuilding();

    // if actions is not an array, convert it to an array
    if (!Array.isArray(actions)) {
      actions = [actions];
    }

    // loop over array of actions and add them to the list of actions
    for (const action of actions) {
      // push action into array and throw runtime error if action is null or undefined
      if (this.actionInputs) {
        this.actionInputs.push(
          objects.requireNonNil(
            action,
            'action cannot be null or undefined. Please pass a valid ActionInput object.'
          )
        );
      }
    }

    return this;
  }

  /**
   * Checks the schema and validates the actions.
   *
   * @param {ActionInput[]} actions - The values of the actions to be executed.
   * @returns {CheckSchema} - An object containing the database identifier, action name, action schema, and prepared actions.
   */
  private async checkSchema(actions?: ActionInput[]): Promise<CheckSchema> {
    // retrieve the schema for the database
    const schema = await this.kwil.getSchema(this.dbid);

    // throw an error if the schema does not have any actions.
    if (!schema?.data?.actions && !schema.data?.procedures) {
      throw new Error(
        `Could not retrieve actions or procedures for database ${this.dbid}. Please double check that you have the correct DBID.`
      );
    }

    // validate the the name exists on the schema.
    const actionSchema = schema.data.actions?.find((a) => a.name === this.actionName);
    const procedureSchema = schema.data.procedures?.find((p) => p.name === this.actionName);

    const foundActionOrProcedure = actionSchema || procedureSchema;

    if (!foundActionOrProcedure) {
      throw new Error(
        `Could not find action or procedure ${this.actionName} in database ${this.dbid}. Please double check that you have the correct DBID and action name.`
      );
    }

    const validated = objects.validateRequiredFields(foundActionOrProcedure, ['name', 'public']);

    const execSchema: ExecSchema = actionSchema
      ? {
          name: validated.name,
          public: validated.public,
          parameters: actionSchema.parameters,
          modifiers: actionSchema.modifiers,
        }
      : {
          // if we have reached this point and actionSchema is null, then we know that procedureSchema is not null.
          name: validated.name,
          public: validated.public,
          parameters: procedureSchema?.parameters?.map((p) => p.name) || [],
          modifiers: procedureSchema?.modifiers,
        };

    if (actions) {
      // ensure that no action inputs or values are missing
      const preparedActions = this.prepareActions(actions, execSchema, this.actionName);

      return {
        dbid: this.dbid,
        actionName: this.actionName,
        modifiers: execSchema.modifiers,
        preparedActions,
      };
    }

    return {
      dbid: this.dbid,
      actionName: this.actionName,
      modifiers: execSchema.modifiers,
      preparedActions: [],
    };
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

    // return this.constructEncodedValues(preparedActions);
    return encodeNestedArguments(preparedActions);
  }

  private assertNotBuilding(): void {
    if (this.actionInputs === TXN_BUILD_IN_PROGRESS) {
      throw new Error('Cannot modify the builder while a transaction is being built.');
    }
  }
}
