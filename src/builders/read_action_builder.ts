import {Kwil} from "../client/kwil";
import { ReadActionBuilder, SignerSupplier } from "../core/builders";
import { objects } from "../utils/objects";
import { Nillable, NonNil, Promisy } from "../utils/types";
import { ReadActionBody, ReadActionPayload, ReadActionReq } from "../core/readAction";
import { ActionSchema } from "../core/database";
import { ConcatBytes, MarshalB64 } from "../utils/bytes";
import { sha384BytesToBytes } from "../utils/crypto";
import { base64ToBytes, bytesToBase64 } from "../utils/base64";
import { sign as crypto_sign } from "../utils/crypto";
import { Signature } from "../core/signature";
import { GenericResponse } from "../core/resreq";
import Client from "../api_client/client";

const READ_ACTION_IN_PROGRESS: Map<string, string> = new Map();

export class ReadActionBuilderImpl implements ReadActionBuilder {
    private readonly client: Kwil;
    private _signer: Nillable<SignerSupplier>;
    private _name: Nillable<string>;
    private _dbid: Nillable<string>;
    private _params: Nillable<Map<string, string>>;
    private readonly requestClient: Client; 

    private constructor(client: Kwil, requestClient: Client) {
        this.client = objects.requireNonNil(client);
        this.requestClient = objects.requireNonNil(requestClient);
    }

    public static of(client: Kwil, requestClient: Client): ReadActionBuilderImpl {
        return new ReadActionBuilderImpl(client, requestClient);
    }

    name(actionName: string): ReadActionBuilderImpl {
        this.assertNotBuilding();

        this._name = objects.requireNonNil(actionName.toLowerCase());
        return this;
    }

    dbid(dbid: string): ReadActionBuilderImpl {
        this.assertNotBuilding();

        this._dbid = objects.requireNonNil(dbid);
        return this;
    }

    signer(signer: SignerSupplier): ReadActionBuilderImpl {
        this.assertNotBuilding();

        this._signer = objects.requireNonNil(signer);
        return this;
    }

    concat(params: Map<string, string>): ReadActionBuilderImpl {
        this.assertNotBuilding();

        this._params = objects.requireNonNil(params);
        return this;
    }

    async buildAndRequest(): Promise<GenericResponse<string>> {
        const body = await this.build();
        return await this.request(body);
    }

    private async build(): Promise<ReadActionBody> {
        this.assertNotBuilding();

        const cached = objects.requireNonNil(this._params);
        this._params = READ_ACTION_IN_PROGRESS;

        return await this
            .doBuild(cached)
            .finally(() => {
                this._params = cached;
            });
    };

    private async request(body: NonNil<ReadActionBody>): Promise<GenericResponse<string>> {
        return await this.requestClient.callRequest(body);
    }

    private async doBuild(params?: Map<string, string>): Promise<ReadActionBody> {
        const dbid = objects.requireNonNil(this._dbid);
        const name = objects.requireNonNil(this._name);

        const schema = await this.client.getSchema(dbid);
        if(!schema?.data?.actions) {
            throw new Error(`Could not retrieve actions for database ${dbid}. Please double check that you have the correct DBID.`);
        }

        const actionSchema = schema.data.actions.find((action) => action.name === name);
        if (!actionSchema) {
            throw new Error(`Could not find action ${name} for database ${dbid}. Please double check that you have the correct DBID and action name.`);
        };

        if(actionSchema.mutability !== 'view') {
            throw new Error(`Action ${name} for database ${dbid} is not a view action. If you are looking to execute a state-changing action, please use kwil.actionBuilder()`);
        }

        let body: ReadActionReq = {
            payload: {
                dbid: dbid,
                name: name,
            },
            sender: "",
        }

        if(params) {
            const params = objects.requireNonNil(this._params);
            body.payload.params = this.prepareParams(params, actionSchema, name);
        }

        if(actionSchema.auxiliaries && actionSchema.auxiliaries.includes("must_sign")) {
            const signer = await Promisy.resolveOrReject(this._signer);
            const sender = (await signer.getAddress()).toLowerCase();
            body.sender = sender;
            body.signature = await ReadActionBuilderImpl.sign(body, signer);
        }

        return new ReadActionBody(body);
    }

    private static async sign(body: ReadActionReq, signer: SignerSupplier): Promise<Signature> {
        const hash = this.hash_txn(body.payload);
        return await crypto_sign(hash, signer);
    }

    private static hash_txn(body: NonNil<ReadActionPayload>): string {
        const marshal = MarshalB64(body);
        const payloadHash = sha384BytesToBytes(base64ToBytes(marshal));
        const hash = sha384BytesToBytes(ConcatBytes(payloadHash));
        return bytesToBase64(hash);
    }

    private prepareParams(inputs: Map<string, string>, actionSchema: ActionSchema, actionName: string): Map<string, string> {
        if((!actionSchema.inputs || actionSchema.inputs.length === 0) && inputs.size === 0) {
            return new Map<string, string>();
        }

        if(!actionSchema.inputs) {
            throw new Error(`Action ${actionName} does not take any parameters. Please double check that you have the correct action name.`);
        }

        if(inputs.size === 0) {
            throw new Error(`Received an empty map for action ${actionName} inputs. ${actionName} requires the following inputs: ${actionSchema.inputs.map((input) => input).join(", ")}`);
        }

        // check if any inputs are missing
        const missingInputs = actionSchema.inputs.filter((input) => !inputs.has(input));

        if(missingInputs.length > 0) {
            throw new Error(`Missing inputs for action ${actionName}: ${missingInputs.join(", ")}`);
        }

        // check if any extra inputs were provided
        const extraInputs = Array.from(inputs.keys()).filter((input) => !actionSchema.inputs?.includes(input));

        if(extraInputs.length > 0) {
            throw new Error(`Extra inputs for action ${actionName}: ${extraInputs.join(", ")}. Please make sure you only provide the required inputs.`);
        }
        
        return inputs;
    }

    private assertNotBuilding() : void {
        if (this._params === READ_ACTION_IN_PROGRESS) {
            throw new Error("Cannot modify the builder while a transaction is being built.");
        }
    }
}