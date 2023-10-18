import { Transaction } from "../core/tx";
import { objects } from "../utils/objects";
import { HexString, Nillable, NonNil, Promisy } from "../utils/types";
import { Kwil } from "../client/kwil";
import { ActionBuilder, CustomSigner, EthSigner, SignerSupplier, PayloadBuilder } from "../core/builders";
import { PayloadBuilderImpl } from "./payload_builder";
import { ActionInput } from "../core/action";
import { ActionSchema } from "../core/database";
import { PayloadType, ValueType } from "../core/enums";
import { Message } from "../core/message";
import { SignatureType, getSignatureType } from "../core/signature";
import { UnencodedActionPayload } from "../core/payload";

interface CheckSchema {
    dbid: string;
    name: string;
    actionSchema: ActionSchema;
    preparedActions: ValueType[][] | []
}

const TXN_BUILD_IN_PROGRESS: ActionInput[] = [];
/**
 * `ActionBuilderImpl` class is an implementation of the `ActionBuilder` interface.
 * It helps in building and transactions to execute database actions on the Kwil network.
 */

export class ActionBuilderImpl implements ActionBuilder {
    private readonly client: Kwil;
    private _signer: Nillable<SignerSupplier> = null;
    private _publicKey: Nillable<HexString | Uint8Array> = null;
    private _actions: ActionInput[] = [];
    private _signatureType: Nillable<SignatureType>;
    private _name: Nillable<string>;
    private _dbid: Nillable<string>;
    private _description: Nillable<string> = null;

    /**
     * Initializes a new `ActionBuilder` instance.
     * 
     * @param {Kwil} client - The Kwil client, used to call higher level methods on the Kwil class.
     * @returns {ActionBuilder} A new `ActionBuilder` instance.
     */
    private constructor(client: Kwil) {
        this.client = objects.requireNonNil(client, "client cannot be null or undefined. Please pass a valid Kwil client. This is an internal error, please create an issue.");
    }

    /**
     * Creates a new `ActionBuilder` instance.
     * 
     * @param {Kwil} client - The Kwil client, used to call higher level methods on the Kwil class.
     * @returns {ActionBuilder} A new `ActionBuilder` instance.
     */
    public static of(client: NonNil<Kwil>): NonNil<ActionBuilder> {
        return new ActionBuilderImpl(client);
    }

    /**
     * Specifies the name of the action to be executed.
     * 
     * @param {string} actionName - The name of the action to be executed.
     * @returns {ActionBuilder} The current `ActionBuilder` instance for chaining.
     * @throws Will throw an error if the value is specified while the action is being built.
     * @throws Will throw an error if the action name is null or undefined.
     */
    name(actionName: string): NonNil<ActionBuilder> {
        this.assertNotBuilding();

        // throw runtime error if action name is null or undefined
        this._name = objects.requireNonNil(actionName.toLowerCase(), 'action name cannot be null or undefined. please specify the action name you wish to execute.');
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
        this._dbid = objects.requireNonNil(dbid, 'dbid cannot be null or undefined. please specify the dbid of the database you wish to execute an action on.');
        return this;
    }

    /**
     * Specify the signer for the action operation.
     * 
     * @param {EthSigner} signer - The signer for the database operation. This must be a signer from Ethers v5 or Ethers v6.
     * @returns {ActionBuilder} The current `ActionBuilder` instance for chaining.
     * @throws Will throw an error if the value is specified while the action is being built.
     * @throws Will throw an error if the signer is null or undefined.
     * @throws Will throw an error if it cannot infer the signature type from the signer.
     */
    signer(signer: EthSigner): NonNil<ActionBuilder>;

    /**
     * Specify the signer for the action operation.
     * 
     * @param {CustomSigner} signer - The signer for the database operation. This must be a custom signer function of the form `(message: Uint8Array, ...args: any[]) => Promise<Uint8Array>`.
     * @param {SignatureType} signatureType - The signature type for the database operation. This can be a `SignatureType` enum value or a string for a network-specific signature type, if implemented at the network level.
     * @returns {ActionBuilder} The current `ActionBuilder` instance for chaining.
     * @throws Will throw an error if the value is specified while the action is being built.
     * @throws Will throw an error if the signer is null or undefined.
     * @throws Will throw an error if the signature type is null or undefined.
     */
    signer(signer: CustomSigner, signatureType: SignatureType): NonNil<ActionBuilder>;

    /** 
     * Specifies the signer for the action operation.
     * 
     * @param {SignerSupplier} signer - The signer for the database operation. This can be a signer from Ethers v5 or Ethers v6 or a custom signer function of the form `(message: Uint8Array, ...args: any[]) => Promise<Uint8Array>`.
     * @param {SignatureType} signatureType - The signature type for the database operation. This can be a `SignatureType` enum value or a string for a network-specific signature type. Ethers v5 and Ethers v6 signers will have the signature type inferred from the signer.
     * @returns {ActionBuilder} The current `ActionBuilder` instance for chaining.
     * @throws Will throw an error if the value is specified while the action is being built.
     * @throws Will throw an error if the signer is null or undefined.
     * @throws Will throw an error if the signature type is null or undefined.
     * @throws Will throw an error if it cannot infer the signature type from the signer.
    */
    signer(signer: SignerSupplier, signatureType?: SignatureType): NonNil<ActionBuilder> {
        this.assertNotBuilding();

        // throw runtime error if signer is null or undefined
        this._signer = objects.requireNonNil(signer, 'no signer provided. please specify a signing function or pass an Ethers signer in the KwilSigner.');

        if (!signatureType) {
            // infer signature type from signer
            this._signatureType = getSignatureType(signer);

            // throw runtime error if signature type could not be inferred
            if (this._signatureType === SignatureType.SIGNATURE_TYPE_INVALID) {
                throw new Error("Could not determine signature type from signer. Please specify a signature type in the KwilSigner.");
            }
            return this;
        }

        // throw runtime error if signature type is null or undefined
        this._signatureType = objects.requireNonNil(signatureType, 'signature type cannot be null or undefined. please specify signature type.');

        return this;
    }

    /**
     * Specifies the public key of the wallet signing for the database operation.
     * 
     * @param {HexString | Uint8Array} publicKey - The public key of the wallet signing for the database operation.
     * @returns {ActionBuilder} The current `ActionBuilder` instance for chaining.
     * @throws Will throw an error if the value is specified while the action is being built.
     * @throws Will throw an error if the public key is null or undefined.
     */
    publicKey(publicKey: HexString | Uint8Array): NonNil<ActionBuilder> {
        this.assertNotBuilding();

        // throw runtime error if public key is null or undefined
        this._publicKey = objects.requireNonNil(publicKey, 'public key cannot be null or undefined.');
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
        this._description = objects.requireNonNil(description, 'description cannot be null or undefined.');
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
            this._actions.push(objects.requireNonNil(action, 'action cannot be null or undefined. Please pass a valid ActionInput object.'));
        }

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
            .finally(() => this._actions = cached);
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
            .finally(() => this._actions = cached);
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
        const { dbid, name, preparedActions, actionSchema } = await this.checkSchema(actions);

        // throw runtime error if signer is null or undefined
        const signer = objects.requireNonNil(this._signer, 'signer is required to build a transaction.');

        // resolve the public key and throw a runtime error if it is null or undefined
        const publicKey = await Promisy.resolveOrReject(this._publicKey, 'public key is required to build a transaction.');

        // resolve the signature type and throw a runtime error if it is null or undefined
        const signatureType = await Promisy.resolveOrReject(this._signatureType, 'signature type is required to build a transaction.');

        // throw runtime error if action is a view action. view actions require a different payload structure than transactions.
        if (actionSchema.mutability === "view") {
            throw new Error(`Action ${name} is a 'view' action. Please use kwil.call().`);
        }

        // construct payload
        const payload: UnencodedActionPayload<PayloadType.EXECUTE_ACTION> = {
            "dbid": dbid,
            "action": name,
            "arguments": preparedActions
        }

        // build the transaction
        const tx = PayloadBuilderImpl
            .of(this.client)
            .payloadType(PayloadType.EXECUTE_ACTION)
            .payload(payload)
            .signer(signer, signatureType)
            .description(this._description)
            .publicKey(publicKey)

        return tx.buildTx();
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
        const { dbid, name, preparedActions, actionSchema } = await this.checkSchema(action);

        // throw a runtime error if more than one set of inputs is trying to be executed. Call does not allow bulk execution.
        if (preparedActions && preparedActions.length > 1) {
            throw new Error("Cannot pass an array of actions inputs to a message. Please pass a single action input object.");
        }

        // throw runtime error if action is not a view action. transactions require a different payload structure than view actions.
        if (actionSchema.mutability === "update") {
            throw new Error(`Action ${name} is not a view only action. Please use kwil.execute().`);
        }

        // resolve if a signer is or is not specified. Only actions with `mustsign` require a signer.
        const signer = this._signer ? this._signer : null;

        // construct payload. If there are no prepared actions, then the payload is an empty array.
        const payload: UnencodedActionPayload<PayloadType.CALL_ACTION> = {
            "dbid": dbid,
            "action": name,
            "arguments": preparedActions ? preparedActions[0] : []
        }

        let msg: PayloadBuilder = PayloadBuilderImpl
            .of(this.client)
            .payload(payload)

        // if a signer is specified, add the signer, signature type, public key, and description to the message
        if (signer) {
            const publicKey = await Promisy.resolveOrReject(this._publicKey);
            const signatureType = await Promisy.resolveOrReject(this._signatureType);
            msg = msg
                .signer(signer, signatureType)
                .publicKey(publicKey)
                .description(this._description);
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
        const dbid = objects.requireNonNil(this._dbid, 'dbid is required to execute or call an action.');
        const name = objects.requireNonNil(this._name, 'action name is required to execute or call an action.');

        // retrieve the schema for the database
        const schema = await this.client.getSchema(dbid);

        // throw an error if the schema does not have any actions.
        if (!schema?.data?.actions) {
            throw new Error(`Could not retrieve actions for database ${dbid}. Please double check that you have the correct DBID.`);
        }

        // validate the the name exists on the schema.
        const actionSchema = schema.data.actions.find((act) => act.name == name);
        if (!actionSchema) {
            throw new Error(`Could not find action ${name} in database ${dbid}. Please double check that you have the correct DBID and action name.`);
        }

        if (actions) {
            // ensure that no action inputs or values are missing
            const preparedActions = this.prepareActions(actions, actionSchema, name);
            return {
                dbid: dbid,
                name: name,
                actionSchema: actionSchema,
                preparedActions: preparedActions
            }
        } else {
            return {
                dbid: dbid,
                name: name,
                actionSchema: actionSchema,
                preparedActions: []
            }
        }
    }

    /**
     * Validates that the action is not missing any inputs. 
     * 
     * @param {ActionInput[]} actions - The values of the actions to be executed.
     * @param {ActionSchema} actionSchema - The schema of the action to be executed.
     * @param {string} actionName - The name of the action to be executed.
     * @returns {ValueType[][]} - An array of arrays of values to be executed.
     */
    private prepareActions(actions: ActionInput[], actionSchema: ActionSchema, actionName: string): ValueType[][] {
        // if action does not require inputs, return an empty array
        if ((!actionSchema.inputs || actionSchema.inputs.length === 0) && actions.length === 0) {
            return [];
        }

        // throw runtime error if action does not have any inputs but inputs were provided
        if (!actionSchema.inputs) {
            throw new Error(`No inputs found for action schema: ${actionName}.`)
        }

        // throw runtime error if no actions were provided but inputs are required
        if (actions.length == 0) {
            throw new Error("No action data has been added to the ActionBuilder.");
        }

        // track the missing actions
        const missingActions = new Set<string>();
        actionSchema.inputs.forEach((i) => {
            const found = actions.find((a) => a.containsKey(i));
            if (!found) {
                missingActions.add(i);
            }
        });

        if (missingActions.size > 0) {
            throw new Error(`Actions do not match action schema inputs: ${Array.from(missingActions)}`)
        }

        const preparedActions: ValueType[][] = [];
        const missingInputs = new Set<string>();
        actions.forEach((a) => {
            const copy = ActionInput.from(a);
            actionSchema.inputs.forEach((i) => {
                if (missingInputs.has(i)) {
                    return;
                }

                if (!copy.containsKey(i)) {
                    missingInputs.add(i);
                    return;
                }

                if (missingInputs.size > 0) {
                    return;
                }

                const val = copy.get(i);

                copy.put(i, val);
            })

            if (missingInputs.size === 0) {
                preparedActions.push(actionSchema.inputs.map((i) => {
                    const val = copy.get(i)
                    if (val) {
                        return val.toString();
                    }
                    return val;
                }));
            }
        });

        if (missingInputs.size > 0) {
            throw new Error(`Inputs are missing for actions: ${Array.from(missingInputs)}`)
        }

        return preparedActions;
    }

    private assertNotBuilding(): void {
        if (this._actions === TXN_BUILD_IN_PROGRESS) {
            throw new Error("Cannot modify the builder while a transaction is being built.");
        }
    }
}