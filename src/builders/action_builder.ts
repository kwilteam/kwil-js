import {PayloadType, Transaction} from "../core/tx";
import {AnyMap} from "../utils/anyMap";
import {bytesToBase64} from "../utils/base64";
import {inputToDataType} from "../core/enums";
import {marshal} from "../core/marshal";
import {objects} from "../utils/objects";
import {awaitable, Nillable, NonNil} from "../utils/types";
import {Kwil} from "../client/kwil";
import {ActionBuilder, SignerSupplier} from "../core/builders";
import {TxnBuilderImpl} from "./transaction_builder";

type NewAction = Record<any, any>

export class ActionBuilderImpl implements ActionBuilder {
    private readonly client: Kwil;
    private _signer: Nillable<SignerSupplier> = null;
    private _actions?: AnyMap<any>[]
    private _name: Nillable<string>;
    private _dbid: Nillable<string>;

    private constructor(client: Kwil) {
        this.client = objects.requireNonNil(client);
    }

    public static of(client: NonNil<Kwil>): NonNil<ActionBuilder> {
        return new ActionBuilderImpl(client);
    }

    name(actionName: string): NonNil<ActionBuilder> {
        this._name = objects.requireNonNil(actionName);
        return this;
    }

    dbid(dbid: string): NonNil<ActionBuilder> {
        this._dbid = objects.requireNonNil(dbid);
        return this;
    }

    signer(signer: SignerSupplier): NonNil<ActionBuilder> {
        this._signer = objects.requireNonNil(signer);
        return this;
    }

    set(key: string, value: unknown): NonNil<ActionBuilder> {
        objects.requireNonNil(key);
        return this.setMany([{[key]: value}]);
    }

    setMany(actions: Iterable<NewAction>): NonNil<ActionBuilder> {
        if (!actions) {
            return this;
        }

        for (const action of actions) {
            const newAction = new AnyMap<any>();
            this._actions = [...(this._actions ?? []), newAction];
            for (const key in action) {
                newAction.set(key, action[key]);
            }
        }

        return this;
    }

    private assertValid(actions: AnyMap<any>[], inputs: ReadonlyArray<string>): void {
        if(!inputs) {
            throw new Error("No inputs have been found for schema action.")
        }

        for(const action of actions) {
            if(!inputs) {
                throw new Error("ActionBuilder inputs have not been initialized. Please call init() before calling isComplete().")
            }

            for (const input of inputs) {
                if(!action.get(input)) {
                    throw new Error("ActionBuilder is missing an input. Please call addOrUpdate() before calling build().")
                }
            }
        }
    }

    async buildTx(): Promise<Transaction> {
        if(!this._actions) {
            throw new Error("No actions have been created. Use addOrUpdate prior to building transaction.")
        }

        const dbid = objects.requireNonNil(this._dbid);
        const name = objects.requireNonNil(this._name);
        const actions = objects.requireNonNil(this._actions);
        const signer = await awaitable(objects.requireNonNil(this._signer));

        const schema = await this.client.getSchema(dbid);
        if(!schema?.data?.actions) {
            throw new Error(`Could not retrieve actions for database ${this.dbid}. Please double check that you have the correct DBID.`);
        }

        const a = schema.data.actions.find((act) => act.name == name);
        if(!a) {
            throw new Error(`Could not find action ${name} in database ${dbid}. Please double check that you have the correct DBID and action name.`);
        }

        const inputs = a.inputs;
        this.assertValid(actions, inputs)

        for (const action of this._actions) {
            const inputs = action.map
            for (const val in inputs) {
                const dataType = inputToDataType(inputs[val]);
                inputs[val] = bytesToBase64(marshal(inputs[val], dataType));
            }
        }

        const allActions = this._actions.map((action) => {
            return action.map
        })

        const payload = {
            "action": this.name,
            "dbid": this.dbid,
            "params": allActions
        }

        return TxnBuilderImpl
            .of(this.client)
            .payloadType(PayloadType.EXECUTE_ACTION)
            .payload(payload)
            .signer(signer)
            .build();
    }
}