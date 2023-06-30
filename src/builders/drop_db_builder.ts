import {DBBuilder, SignerSupplier} from "../core/builders";
import { Nillable, NonNil, Promisy } from "../utils/types";
import {Kwil} from "../client/kwil";
import { objects } from "../utils/objects";
import { DropDbPayload } from "../core/tx";
import {PayloadType, Transaction} from "../core/tx";
import { TxnBuilderImpl } from "./transaction_builder";

export class DropDBBuilderImpl implements DBBuilder {
    private readonly client: Kwil;
    private _payload: Nillable<() => NonNil<object>> = null;
    private _signer: Nillable<SignerSupplier> = null;

    private constructor(client: Kwil) {
        this.client = client;
    }

    public static of(client: NonNil<Kwil>): NonNil<DBBuilder> {
        return new DropDBBuilderImpl(objects.requireNonNil(client));
    }

    signer(signer: SignerSupplier): NonNil<DBBuilder> {
        this._signer = objects.requireNonNil(signer);
        return this;
    }

    payload(payload: (() => NonNil<DropDbPayload>) | NonNil<DropDbPayload>): NonNil<DBBuilder> {
        this._payload = typeof objects.requireNonNil(payload) !== "function" ?
            () => payload :
            payload as () => NonNil<DropDbPayload>;

        return this;
    }

    async buildTx(): Promise<Transaction> {
        const payload = objects.requireNonNil(this._payload);
        const signer = await Promisy.resolveOrReject(this._signer);
        return TxnBuilderImpl
            .of(this.client)
            .payloadType(PayloadType.DROP_DATABASE)
            .payload(objects.requireNonNil(payload))
            .signer(objects.requireNonNil(signer))
            .build();
    }
}