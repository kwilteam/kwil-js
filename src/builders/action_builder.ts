import { Transaction } from "../core/tx";
import {objects} from "../utils/objects";
import {Nillable, NonNil, Promisy} from "../utils/types";
import {Kwil} from "../client/kwil";
import {ActionBuilder, SignerSupplier, TxnBuilder} from "../core/builders";
import {TxnBuilderImpl} from "./transaction_builder";
import {ActionInput} from "../core/actionInput";
import {ActionSchema} from "../core/database";
import { PayloadType, ValueType } from "../core/enums";
import { Message, UnencodedMessagePayload } from "../core/message";
import { AnySignatureType, SignatureType, getSignatureType } from "../core/signature";

interface CheckSchema {
    dbid: string;
    name: string;
    actionSchema: ActionSchema;
    preparedActions?: ValueType[][]
}

const TXN_BUILD_IN_PROGRESS: ActionInput[] = [];
/**
 * `ActionBuilderImpl` class is an implementation of the `ActionBuilder` interface.
 * It helps in building and transactions to execute database actions on the Kwil network.
 */

export class ActionBuilderImpl implements ActionBuilder {
    private readonly client: Kwil;
    private _signer: Nillable<SignerSupplier> = null;
    private _publicKey: Nillable<string | Uint8Array> = null;
    private _actions: ActionInput[] = [];
    private _signatureType: Nillable<AnySignatureType>;
    private _name: Nillable<string>;
    private _dbid: Nillable<string>;
    private _description: Nillable<string> = null;

    private constructor(client: Kwil) {
        this.client = objects.requireNonNil(client);
    }

    public static of(client: NonNil<Kwil>): NonNil<ActionBuilder> {
        return new ActionBuilderImpl(client);
    }

    name(actionName: string): NonNil<ActionBuilder> {
        this.assertNotBuilding();

        this._name = objects.requireNonNil(actionName.toLowerCase());
        return this;
    }

    dbid(dbid: string): NonNil<ActionBuilder> {
        this.assertNotBuilding();

        this._dbid = objects.requireNonNil(dbid);
        return this;
    }

    signer(signer: SignerSupplier, signatureType?: AnySignatureType): NonNil<ActionBuilder> {
        this.assertNotBuilding();

        this._signer = objects.requireNonNil(signer);

        if(!signatureType) {
            this._signatureType = getSignatureType(signer);
            if(this._signatureType === SignatureType.SIGNATURE_TYPE_INVALID) {
                throw new Error("Could not determine signature type from signer. Please pass a signature type to .signer().");
            }
            return this;
        }

        this._signatureType = objects.requireNonNil(signatureType);

        return this;
    }

    publicKey(publicKey: string | Uint8Array): NonNil<ActionBuilder> {
        this.assertNotBuilding();
        this._publicKey = objects.requireNonNil(publicKey);
        return this;
    }

    description(description: string): ActionBuilder {
        this.assertNotBuilding();
        this._description = objects.requireNonNil(description);
        return this;
    }

    concat(actions: ActionInput[] | ActionInput): NonNil<ActionBuilder> {
        this.assertNotBuilding();
        
        if (!Array.isArray(actions)) {
            actions = [actions];
        }

        for (const action of actions) {
            this._actions.push(objects.requireNonNil(action));
        }

        return this;
    } 

    async buildTx(): Promise<Transaction> {
        this.assertNotBuilding();

        const cached = objects.requireNonNil(this._actions);
        this._actions = TXN_BUILD_IN_PROGRESS;

        return await this
            .dobuildTx(cached)
            .finally(() => this._actions = cached);
    }

    async buildMsg(): Promise<Message> {
        this.assertNotBuilding();

        const cached = this._actions;
        this._actions = TXN_BUILD_IN_PROGRESS;

        return await this
            .doBuildMsg(cached.length > 0 ? cached : undefined)
            .finally(() => this._actions = cached);
    }

    private async dobuildTx(actions: ActionInput[]): Promise<Transaction> {
        const { dbid, name, preparedActions } = await this.checkSchema(actions);

        const signer = objects.requireNonNil(this._signer);
        const publicKey = await Promisy.resolveOrReject(this._publicKey);
        const signatureType = await Promisy.resolveOrReject(this._signatureType);

        const payload = {
            "dbid": dbid,
            "action": name,
            "params": preparedActions
        }

        const tx = TxnBuilderImpl
            .of(this.client)
            .payloadType(PayloadType.EXECUTE_ACTION)
            .payload(payload)
            .signer(signer, signatureType)
            .description(this._description)
            .publicKey(publicKey)
        
        return tx.buildTx();
    }

    private async doBuildMsg(action?: ActionInput[]): Promise<Message> {
        const { dbid, name, preparedActions, actionSchema } = await this.checkSchema(action ? action : undefined);

        if(preparedActions && preparedActions.length > 1) {
            throw new Error("Cannot pass an array of actions inputs to a message. Please pass a single action input object.");
        }

        if(actionSchema.mutability === "update") {
            throw new Error(`Action ${name} is not a state-changing action. Please use buildTx() instead.`);
        }

        if(actionSchema.inputs && actionSchema.inputs.length > 0 && (!preparedActions || preparedActions.length === 0)) {
            throw new Error(`Action ${name} requires inputs. Please provide inputs. With the ActionInput class and .concat method.`);
        }

        const signer = this._signer ? this._signer : null;

        const payload: UnencodedMessagePayload = !preparedActions ? {
            "dbid": dbid,
            "action": name,
            "arguments": []
        } : {
            "dbid": dbid,
            "action": name,
            "arguments": preparedActions[0]
        }

        let msg: TxnBuilder = TxnBuilderImpl
            .of(this.client)
            .payload(payload)

        if(signer) {
            const publicKey = await Promisy.resolveOrReject(this._publicKey);
            const signatureType = await Promisy.resolveOrReject(this._signatureType);
            msg = msg
                .signer(signer, signatureType)
                .publicKey(publicKey)
                .description(this._description);
        }

        return await msg.buildMsg();
    }

    private async checkSchema(actions?: ActionInput[]): Promise<CheckSchema> {
        const dbid = objects.requireNonNil(this._dbid);
        const name = objects.requireNonNil(this._name);

        const schema = await this.client.getSchema(dbid);
        if (!schema?.data?.actions) {
            throw new Error(`Could not retrieve actions for database ${dbid}. Please double check that you have the correct DBID.`);
        }

        const actionSchema = schema.data.actions.find((act) => act.name == name);
        if (!actionSchema) {
            throw new Error(`Could not find action ${name} in database ${dbid}. Please double check that you have the correct DBID and action name.`);
        }

        if(actions) {
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
                actionSchema: actionSchema
            }
        }
  
    }

    private prepareActions(actions: ActionInput[], actionSchema: ActionSchema, actionName: string): ValueType[][] {
        if ((!actionSchema.inputs || actionSchema.inputs.length === 0) && actions.length === 0) {
            return [];
        }

        if(!actionSchema.inputs) {
            throw new Error(`No inputs found for action schema: ${actionName}.`)
        }

        if(actions.length == 0) {
            throw new Error("No action data has been added to the ActionBuilder.");
        }

        const missingActions = new Set<string>();
        actionSchema.inputs.forEach((i) => {
            const found = actions.find((a) => a.containsKey(i));
            if(!found) {
                missingActions.add(i);
            }
        });

        if(missingActions.size > 0) {
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

                if(!copy.containsKey(i)) {
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
                    if(val) {
                        return val.toString();
                    }
                    return val;
                }));
            }
        });

        if(missingInputs.size > 0) {
            throw new Error(`Inputs are missing for actions: ${Array.from(missingInputs)}`)
        }

        return preparedActions;
    }

    private assertNotBuilding() : void {
        if (this._actions === TXN_BUILD_IN_PROGRESS) {
            throw new Error("Cannot modify the builder while a transaction is being built.");
        }
    }
}