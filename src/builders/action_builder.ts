import {PayloadType, Transaction} from "../core/tx";
import {bytesToBase64} from "../utils/base64";
import {inputToDataType} from "../core/enums";
import {marshal} from "../core/marshal";
import {objects} from "../utils/objects";
import {Nillable, NonNil, Promisy} from "../utils/types";
import {Kwil} from "../client/kwil";
import {ActionBuilder, SignerSupplier} from "../core/builders";
import {TxnBuilderImpl} from "./transaction_builder";
import {Action} from "../core/action";
import {ActionSchema} from "../core/database";

const TXN_BUILD_IN_PROGRESS: Action[] = [];

export class ActionBuilderImpl implements ActionBuilder {
    private readonly client: Kwil;
    private _signer: Nillable<SignerSupplier> = null;
    private _actions: Action[] = [];
    private _name: Nillable<string>;
    private _dbid: Nillable<string>;

    private constructor(client: Kwil) {
        this.client = objects.requireNonNil(client);
    }

    public static of(client: NonNil<Kwil>): NonNil<ActionBuilder> {
        return new ActionBuilderImpl(client);
    }

    name(actionName: string): NonNil<ActionBuilder> {
        this.assertNotBuilding();

        this._name = objects.requireNonNil(actionName);
        return this;
    }

    dbid(dbid: string): NonNil<ActionBuilder> {
        this.assertNotBuilding();

        this._dbid = objects.requireNonNil(dbid);
        return this;
    }

    signer(signer: SignerSupplier): NonNil<ActionBuilder> {
        this.assertNotBuilding();

        this._signer = objects.requireNonNil(signer);
        return this;
    }

    concat(... actions: Action[]): NonNil<ActionBuilder> {
        this.assertNotBuilding();

        if (!actions) {
            return this;
        }

        for (const action of actions) {
            this._actions.push(objects.requireNonNil(action));
        }

        return this;
    }

    async buildTx(): Promise<Transaction> {
        this.assertNotBuilding();
        if(this._actions.length == 0) {
            throw new Error("No action data has been added to the ActionBuilder.");
        }

        const cached = objects.requireNonNil(this._actions);
        this._actions = TXN_BUILD_IN_PROGRESS;

        return await this
            .dobuildTx(cached)
            .finally(() => this._actions = cached);
    }

    async dobuildTx(actions: Action[]): Promise<Transaction> {
        const dbid = objects.requireNonNil(this._dbid);
        const name = objects.requireNonNil(this._name);
        const signer = await Promisy.resolveOrReject(this._signer);

        const schema = await this.client.getSchema(dbid);
        if (!schema?.data?.actions) {
            throw new Error(`Could not retrieve actions for database ${dbid}. Please double check that you have the correct DBID.`);
        }

        const actionSchema = schema.data.actions.find((act) => act.name == name);
        if (!actionSchema) {
            throw new Error(`Could not find action ${name} in database ${dbid}. Please double check that you have the correct DBID and action name.`);
        }

        const preparedActions = this.prepareActions(actions, actionSchema, name);

        const payload = {
            "action": name,
            "dbid": dbid,
            "params": preparedActions
        }

        return TxnBuilderImpl
            .of(this.client)
            .payloadType(PayloadType.EXECUTE_ACTION)
            .payload(payload)
            .signer(signer)
            .build();
    }

    private prepareActions(actions: Action[], actionSchema: ActionSchema, actionName: string): Action[] {
        if(!actionSchema.inputs) {
            throw new Error(`No inputs found for action schema: ${actionName}.`)
        }

        const missingActions = new Set<string>();
        actionSchema.inputs.forEach((i) => {
            const found = actions.find((a) => a.containsKey(i));
            if(!found) {
                missingActions.add(i);
            }
        });

        if(missingActions.size > 0) {
            throw new Error(`Actions do not match action schema inputs: ${missingActions}`)
        }

        const preparedActions: Action[] = [];
        const missingInputs = new Set<string>();
        actions.forEach((a) => {
            const copy = Action.from(a);
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
                const dataType = inputToDataType(val);
                copy.put(i, bytesToBase64(marshal(val, dataType)));
            })

            if (missingInputs.size === 0) {
                preparedActions.push(copy);
            }
        });

        if(missingInputs.size > 0) {
            throw new Error(`Inputs are missing for actions: ${missingInputs}`)
        }

        return preparedActions;
    }

    private assertNotBuilding() : void {
        if (this._actions === TXN_BUILD_IN_PROGRESS) {
            throw new Error("Cannot modify the builder while a transaction is being built.");
        }
    }
}