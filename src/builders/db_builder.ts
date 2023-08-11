import {DropDbPayload, PayloadType, Transaction} from "../core/tx";
import {Nillable, NonNil, Promisy} from "../utils/types";
import {objects} from "../utils/objects";
import {Kwil} from "../client/kwil";
import {TxnBuilderImpl} from "./transaction_builder";
import {DBBuilder, SignerSupplier} from "../core/builders";

/**
 * `DBBuilderImpl` class is an implementation of the `DBBuilder` interface.
 * It creates a transaction to deploy a new database on the Kwil network.
 */

export class DBBuilderImpl implements DBBuilder {
    private readonly client: Kwil;
    private _payload: Nillable<() => NonNil<object>> = null;
    private _signer: Nillable<SignerSupplier> = null;
    private _payloadType: Nillable<PayloadType> = null;

    private constructor(client: Kwil, payloadType: PayloadType) {
        this.client = client;
        this._payloadType = payloadType;
    }

    public static of(client: NonNil<Kwil>, payloadType: NonNil<PayloadType>): NonNil<DBBuilder> {
        return new DBBuilderImpl(objects.requireNonNil(client), objects.requireNonNil(payloadType));
    }

    signer(signer: SignerSupplier): NonNil<DBBuilder> {
        this._signer = objects.requireNonNil(signer);
        return this;
    }

    payload(payload: (() => NonNil<object | DropDbPayload>) | NonNil<object | DropDbPayload>): NonNil<DBBuilder> {
        this._payload = typeof objects.requireNonNil(payload) !== "function" ?
            () => payload :
            payload as () => NonNil<object>;

        return this;
    }

    async buildTx(): Promise<Transaction> {
        const payload = objects.requireNonNil(this._payload);
        const payloadType = objects.requireNonNil(this._payloadType);
        const signer = await Promisy.resolveOrReject(this._signer);
        return TxnBuilderImpl
            .of(this.client)
            .payloadType(objects.requireNonNil(payloadType))
            .payload(objects.requireNonNil(payload))
            .signer(objects.requireNonNil(signer))
            .buildTx();
    }
}
