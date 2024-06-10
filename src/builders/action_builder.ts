import { Transaction } from '../core/tx';
import { objects } from '../utils/objects';
import { HexString, Nillable, NonNil, Promisy } from '../utils/types';
import { Kwil } from '../client/kwil';
import { ActionBuilder, SignerSupplier, PayloadBuilder } from '../core/builders';
import { PayloadBuilderImpl } from './payload_builder';
import { ActionInput } from '../core/action';
import { EnvironmentType, PayloadType, ValueType, VarType } from '../core/enums';
import { AnySignatureType, SignatureType, getSignatureType } from '../core/signature';
import { EncodedValue, UnencodedActionPayload } from '../core/payload';
import { Message } from '../core/message';
import { DataType } from '../core/database';

interface CheckSchema {
  dbid: string;
  name: string;
  modifiers?: ReadonlyArray<string>;
  preparedActions: EncodedValue[][];
}

interface ExecSchema {
  name: string;
  public: boolean;
  parameters?: ReadonlyArray<string>;
  modifiers?: ReadonlyArray<string>;
}

const TXN_BUILD_IN_PROGRESS: ActionInput[] = [];
/**
 * `ActionBuilderImpl` class is an implementation of the `ActionBuilder` interface.
 * It helps in building and transactions to execute database actions on the Kwil network.
 */

export class ActionBuilderImpl<T extends EnvironmentType> implements ActionBuilder {
  private readonly kwil: Kwil<T>;
  private _signer: Nillable<SignerSupplier> = null;
  private _identifier: Nillable<HexString | Uint8Array> = null;
  private _actions: ActionInput[] = [];
  private _signatureType: Nillable<AnySignatureType>;
  private _name: Nillable<string>;
  private _dbid: Nillable<string>;
  private _chainId: Nillable<string>;
  private _description: Nillable<string> = null;
  private _nonce: Nillable<number> = null;

  /**
   * Initializes a new `ActionBuilder` instance.
   *
   * @param {Kwil} kwil - The Kwil client, used to call higher level methods on the Kwil class.
   * @returns {ActionBuilder} A new `ActionBuilder` instance.
   */
  private constructor(kwil: Kwil<T>) {
    this.kwil = objects.requireNonNil(
      kwil,
      'client cannot be null or undefined. Please pass a valid Kwil client. This is an internal error, please create an issue.'
    );
  }

  /**
   * Creates a new `ActionBuilder` instance.
   *
   * @param {Kwil} client - The Kwil client, used to call higher level methods on the Kwil class.
   * @returns {ActionBuilder} A new `ActionBuilder` instance.
   */
  public static of<T extends EnvironmentType>(client: NonNil<Kwil<T>>): NonNil<ActionBuilder> {
    return new ActionBuilderImpl(client);
  }

  /**
   * Specifies the name of the action to be executed.
   *
   * @param {string} name - The name of the action or procedure to be executed.
   * @returns {ActionBuilder} The current `ActionBuilder` instance for chaining.
   * @throws Will throw an error if the value is specified while the action is being built.
   * @throws Will throw an error if the action name is null or undefined.
   */
  name(name: string): NonNil<ActionBuilder> {
    this.assertNotBuilding();

    // throw runtime error if action name is null or undefined
    this._name = objects.requireNonNil(
      name.toLowerCase(),
      'name cannot be null or undefined. please specify the action or procedure name you wish to execute.'
    );
    return this;
  }

  /**
   * Specifies the database identifier (DBID) of the database that contains the action to be executed.
   *
   * @param {string} dbid - The database identifier.
   * @returns {ActionBuilder} The current `ActionBuilder` instance for chaining.
   * @throws Will throw an error if the value is specified while the action is being built.
   * @throws Will throw an error if the dbid is null or undefined.
   */
  dbid(dbid: string): NonNil<ActionBuilder> {
    this.assertNotBuilding();

    // throw runtime error if dbid is null or undefined
    this._dbid = objects.requireNonNil(
      dbid,
      'dbid cannot be null or undefined. please specify the dbid of the database you wish to execute an action on.'
    );
    return this;
  }

  /**
   * Specifies the signer for the action operation.
   *
   * @param {SignerSupplier} signer - The signer for the database operation. This can be a signer from Ethers v5 or Ethers v6 or a custom signer function of the form `(message: Uint8Array, ...args: any[]) => Promise<Uint8Array>`.
   * @param {AnySignatureType} signatureType - The signature type for the database operation. This can be a `SignatureType` enum value or a string for a network-specific signature type. Ethers v5 and Ethers v6 signers will have the signature type inferred from the signer.
   * @returns {ActionBuilder} The current `ActionBuilder` instance for chaining.
   * @throws Will throw an error if the value is specified while the action is being built.
   * @throws Will throw an error if the signer is null or undefined.
   * @throws Will throw an error if the signature type is null or undefined.
   * @throws Will throw an error if it cannot infer the signature type from the signer.
   */
  signer(signer: SignerSupplier, signatureType?: AnySignatureType): NonNil<ActionBuilder> {
    this.assertNotBuilding();

    // throw runtime error if signer is null or undefined
    this._signer = objects.requireNonNil(
      signer,
      'no signer provided. please specify a signing function or pass an Ethers signer in the KwilSigner.'
    );

    if (!signatureType) {
      // infer signature type from signer
      this._signatureType = getSignatureType(signer);

      // throw runtime error if signature type could not be inferred
      if (this._signatureType === SignatureType.SIGNATURE_TYPE_INVALID) {
        throw new Error(
          'Could not determine signature type from signer. Please specify a signature type in the KwilSigner.'
        );
      }
      return this;
    }

    // throw runtime error if signature type is null or undefined
    this._signatureType = objects.requireNonNil(
      signatureType,
      'signature type cannot be null or undefined. please specify signature type.'
    );

    return this;
  }

  /**
   * Specifies the identifier (e.g. wallet, public key, etc) of the signer for the action.
   *
   * @param {HexString | Uint8Array} identifier - The identifier of the wallet signing for the database operation.
   * @returns {ActionBuilder} The current `ActionBuilder` instance for chaining.
   * @throws Will throw an error if the value is specified while the action is being built.
   * @throws Will throw an error if the identifier is null or undefined.
   */
  publicKey(identifier: HexString | Uint8Array): NonNil<ActionBuilder> {
    this.assertNotBuilding();

    // throw runtime error if identifier is null or undefined
    this._identifier = objects.requireNonNil(
      identifier,
      'identifier cannot be null or undefined. Please pass a valid identifier to the .publicKey() method.'
    );
    return this;
  }

  /**
   * Specifies the description to be included in the message that is signed.
   *
   * @param {string} description - The description to be included in the message that is signed.
   * @returns {ActionBuilder} The current `ActionBuilder` instance for chaining.
   * @throws Will throw an error if the value is specified while the action is being built.
   * @throws Will throw an error if the description is null or undefined.
   */
  description(description: string): ActionBuilder {
    this.assertNotBuilding();

    // throw runtime error if description is null or undefined
    this._description = objects.requireNonNil(
      description,
      'description cannot be null or undefined.'
    );
    return this;
  }

  /**
   * Adds actionInputs to the list of inputs to be executed in the action.
   *
   * @param {ActionInput | ActionInput[]} actions - The actions to add. This should be from the `ActionInput` class.
   * @returns The current `ActionBuilder` instance for chaining.
   * @throws Will throw an error if the value is specified while the action is being built.
   * @throws Will throw an error if the action is null or undefined.
   */
  concat(actions: ActionInput[] | ActionInput): NonNil<ActionBuilder> {
    this.assertNotBuilding();

    // if actions is not an array, convert it to an array
    if (!Array.isArray(actions)) {
      actions = [actions];
    }

    // loop over array of actions and add them to the list of actions
    for (const action of actions) {
      // push action into array and throw runtime error if action is null or undefined
      this._actions.push(
        objects.requireNonNil(
          action,
          'action cannot be null or undefined. Please pass a valid ActionInput object.'
        )
      );
    }

    return this;
  }

  /**
   * Specifies the chain ID for the network being used.
   *
   * @param {string} chainId - The chain ID for the network being used.
   * @returns {ActionBuilder} The current `ActionBuilder` instance for chaining.
   */
  chainId(chainId: string): NonNil<ActionBuilder> {
    this._chainId = objects.requireNonNil(chainId, 'chain ID cannot be null or undefined.');
    return this;
  }

  /**
   * Specifies the nonce for the transaction. If this is not specified, the nonce will be retrieved from the Kwil network.
   *
   * @param {number} nonce - The nonce for the transaction.
   * @returns {ActionBuilder} The current `ActionBuilder` instance for chaining.
   */
  nonce(nonce: number): NonNil<ActionBuilder> {
    this._nonce = nonce;
    return this;
  }

  /**
   * Builds a transaction. This will call the kwil network to retrieve the schema and the signer's account.
   *
   * @returns {Promise<Transaction>} - A promise that resolves to a Transaction object. This transaction can be broadcasted to the Kwil network with the `kwil.broadcast()` api.
   * @throws Will throw an error if the action is being built or if there's an issue with the schema or account retrieval.
   * @throws Will throw an error if the action is not a update action.
   */
  async buildTx(): Promise<Transaction> {
    this.assertNotBuilding();

    // cache the action
    const cached = this._actions;

    // set the actions to a special value to indicate that the transaction is being built
    this._actions = TXN_BUILD_IN_PROGRESS;

    return await this
      // build the transaction
      .dobuildTx(cached)
      // set the actions back to the cached value, signaling that the transaction is no longer being built
      .finally(() => (this._actions = cached));
  }

  /**
   * Builds the message structure for view actions. This can be provided to the `kwil.call()` api.
   *
   * @returns {Promise<Message>} - A message object that can be sent to the Kwil network.
   * @throws Will throw an error if the action is being built or if there's an issue with the schema or account retrieval.
   * @throws Will throw an error if the action is not a view action.
   */
  async buildMsg(): Promise<Message> {
    this.assertNotBuilding();

    // cache the action
    const cached = this._actions;

    // set the actions to a special value to indicate that the message is being built
    this._actions = TXN_BUILD_IN_PROGRESS;

    return await this
      // build the message
      .doBuildMsg(cached)
      // set the actions back to the cached value, signaling that the message is no longer being built
      .finally(() => (this._actions = cached));
  }

  /**
   * Executes all the required logic in the TxnBuildImpl class to build a transaction.
   *
   * @param {ActionInput[]} actions - The actions to be executed.
   * @returns {Transaction} A transaction object that can be broadcasted to the Kwil network.
   * @throws Will throw an error if there's an issue with the schema or account retrieval & validation.
   */
  private async dobuildTx(actions: ActionInput[]): Promise<Transaction> {
    // retrieve the schema and run validations
    const { dbid, name, preparedActions, modifiers } = await this.checkSchema(actions);

    // throw runtime error if signer is null or undefined
    const signer = objects.requireNonNil(
      this._signer,
      'signer is required to build a transaction.'
    );

    // throw runtime error if chainId is not provided
    const chainId = objects.requireNonNil(
      this._chainId,
      'chain ID is required to build a transaction.'
    );

    // resolve the identifier and throw a runtime error if it is null or undefined
    const identifier = await Promisy.resolveOrReject(
      this._identifier,
      'identifier is required to build a transaction.'
    );

    // resolve the signature type and throw a runtime error if it is null or undefined
    const signatureType = await Promisy.resolveOrReject(
      this._signatureType,
      'signature type is required to build a transaction.'
    );

    // throw runtime error if action is a view action. view actions require a different payload structure than transactions.
    if (modifiers && modifiers.includes('VIEW')) {
      throw new Error(`Action / Procedure ${name} is a 'view' action. Please use kwil.call().`);
    }

    // construct payload
    const payload: UnencodedActionPayload<PayloadType.EXECUTE_ACTION> = {
      dbid: dbid,
      action: name,
      arguments: preparedActions,
    };

    // build the transaction
    let tx = PayloadBuilderImpl.of(this.kwil)
      .payloadType(PayloadType.EXECUTE_ACTION)
      .payload(payload)
      .signer(signer, signatureType)
      .description(this._description)
      .chainId(chainId)
      .publicKey(identifier);

    if (this._nonce) {
      tx = tx.nonce(this._nonce);
    }

    return await tx.buildTx();
  }

  /**
   * Executes all of the required logic in the TxnBuildImpl class to build a view action for the call endpoint.
   *
   * @param {ActionInput[]} actions - The actions to be executed.
   * @returns {Message} A message object that can be sent to the Kwil network.
   * @throws Will throw an error if there's an issue with the schema or account retrieval & validation.
   */
  private async doBuildMsg(action: ActionInput[]): Promise<Message> {
    // retrieve the schema and run validations
    const { dbid, name, preparedActions, modifiers } = await this.checkSchema(action);

    // throw a runtime error if more than one set of inputs is trying to be executed. Call does not allow bulk execution.
    if (preparedActions && preparedActions.length > 1) {
      throw new Error(
        'Cannot pass more than one input to the call endpoint. Please pass only one input and try again.'
      );
    }

    // throw runtime error if action is not a view action. transactions require a different payload structure than view actions.
    if (modifiers && modifiers.includes('VIEW') === false) {
      throw new Error(`Action ${name} is not a view only action. Please use kwil.execute().`);
    }

    // resolve if a signer is or is not specified. Only actions with `mustsign` require a signer.
    const signer = this._signer ? this._signer : null;

    // construct payload. If there are no prepared actions, then the payload is an empty array.
    const payload: UnencodedActionPayload<PayloadType.CALL_ACTION> = {
      dbid: dbid,
      action: name,
      // if there are prepared actions, then the first element in the array is the action inputs.
      arguments: preparedActions.length > 0 ? preparedActions[0] : [],
      // if there are nilArgs, then the first element in the array is the nilArgs.
    };

    let msg: PayloadBuilder = PayloadBuilderImpl.of(this.kwil).payload(payload);

    // if a signer is specified, add the signer, signature type, identifier, and description to the message
    if (signer) {
      const identifier = await Promisy.resolveOrReject(this._identifier);
      const signatureType = await Promisy.resolveOrReject(this._signatureType);
      msg = msg.signer(signer, signatureType).publicKey(identifier).description(this._description);
    }

    return await msg.buildMsg();
  }

  /**
   * Checks the schema and validates the actions.
   *
   * @param {ActionInput[]} actions - The values of the actions to be executed.
   * @returns {CheckSchema} - An object containing the database identifier, action name, action schema, and prepared actions.
   */
  private async checkSchema(actions: ActionInput[]): Promise<CheckSchema> {
    // throw runtime errors is dbid or action name is null or undefined
    const dbid = objects.requireNonNil(
      this._dbid,
      'dbid is required to execute or call an action or procedure.'
    );
    const name = objects.requireNonNil(
      this._name,
      'name is required to execute or call an action or procedure.'
    );

    // retrieve the schema for the database
    const schema = await this.kwil.getSchema(dbid);

    // throw an error if the schema does not have any actions.
    if (!schema?.data?.actions && !schema.data?.procedures) {
      throw new Error(
        `Could not retrieve actions or procedures for database ${dbid}. Please double check that you have the correct DBID.`
      );
    }

    // validate the the name exists on the schema.
    const actionSchema = schema.data.actions?.find((a) => a.name === name)
    const procedureSchema = schema.data.procedures?.find((p) => p.name === name)

    const foundActionOrProcedure = actionSchema || procedureSchema;

    if (!foundActionOrProcedure) {
      throw new Error(
        `Could not find action or procedure ${name} in database ${dbid}. Please double check that you have the correct DBID and action name.`
      );
    }

    const execSchema: ExecSchema = actionSchema ?
      {
        name: actionSchema.name,
        public: actionSchema.public,
        parameters: actionSchema.parameters,
        modifiers: actionSchema.modifiers,
      } : {
        // if we have reached this point and actionSchema is null, then we know that procedureSchema is not null.
        name: procedureSchema?.name as string,
        public: procedureSchema?.public as boolean,
        parameters: procedureSchema?.parameters?.map(p => p.name) as string[] || [],
        modifiers: procedureSchema?.modifiers as string[],
      }


    if (actions) {
      // ensure that no action inputs or values are missing
      const preparedActions = this.prepareActions(actions, execSchema, name);
     

      return {
        dbid: dbid,
        name: name,
        modifiers: execSchema.modifiers,
        preparedActions
      };
    }

    return {
      dbid: dbid,
      name: name,
      modifiers: execSchema.modifiers,
      preparedActions: [],
    };
  };

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
      const found = actions.find((a) => a.containsKey(p));
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
        execSchema.parameters && preparedActions.push(
          execSchema.parameters.map((p) => {
            const val = copy.get(p);
            return val
          })
        );
      }
    });

    if (missingInputs.size > 0) {
      throw new Error(`Inputs are missing for actions: ${Array.from(missingInputs)}`);
    }

    let encodedValues: EncodedValue[][] = [];

    // construct the encoded value
    preparedActions.forEach((action) => {
      let singleEncodedValues: EncodedValue[] = [];
      action.forEach((val) => {
        const { metadata, varType } = analyzeVariable(val);

        const metadataSpread = metadata ? { metadata } : {}

        const dataType: DataType = {
          name: varType,
          is_array: Array.isArray(val),
          ...metadataSpread
        }

        let data: string[] | Uint8Array[] = []

        if(Array.isArray(val) && !(val instanceof Uint8Array)) {
          data = val.map((v) => {
            return v?.toString() || ''
          })
        } else if(val instanceof Uint8Array) {
          data = [val]
        } else { 
          data = [val?.toString() || '']
        }

        singleEncodedValues.push({
          type: dataType,
          data
        })
      })

      encodedValues.push(singleEncodedValues)
    })

    return encodedValues;
  }

  private assertNotBuilding(): void {
    if (this._actions === TXN_BUILD_IN_PROGRESS) {
      throw new Error('Cannot modify the builder while a transaction is being built.');
    }
  }
}

function analyzeNumber(num: number) {
  // Convert the number to a string and handle potential negative sign
  const numStr = Math.abs(num).toString();

  // Check for the presence of a decimal point
  const decimalIndex = numStr.indexOf('.');
  const hasDecimal = decimalIndex !== -1;

  // Calculate total digits (excluding the decimal point)
  const totalDigits = hasDecimal ? numStr.length - 1 : numStr.length;

  // Analysis object to hold the results
  const analysis = {
    hasDecimal: hasDecimal,
    totalDigits: totalDigits,
    decimalPosition: hasDecimal ? decimalIndex : -1
  };

  return analysis;
}

function analyzeVariable(val: ValueType): { metadata: [number, number] | undefined, varType: VarType } {
  if(Array.isArray(val)) {
    // In Kwil, if there is an array of values, each value in the array must be of the same type.
    return analyzeVariable(val[0])
  }

  let metadata: [number, number] | undefined;
  // Default to text string
  // Only other types are null or blob. For client-side tooling, everything else can be sent as a string, and Kwil will handle the conversion.
  let varType: VarType = VarType.TEXT;

  switch (typeof val) {
    case 'string':
      break;
    case 'number':
      const numAnalysis = analyzeNumber(val);
      if (numAnalysis.hasDecimal) {
        metadata = [numAnalysis.totalDigits, numAnalysis.decimalPosition];
      }
      break;
    case 'boolean':
      break;
    case 'object':
      if(val instanceof Uint8Array) {
        varType = VarType.BLOB;
        break;
      }
      if(val === null) {
        varType = VarType.NULL;
        break;
      }
    case 'undefined':
      varType = VarType.NULL;
      break;
    default:
      throw new Error(`Unsupported type: ${typeof val}. If using a uuid, blob, or uint256, please convert to a JavaScript string.`);
  }

  return {
    metadata,
    varType
  }
}