import {PayloadType, Transaction} from "../core/tx";
import {awaitable, Nillable, NonNil} from "../utils/types";
import {objects} from "../utils/objects";
import {Kwil} from "../client/kwil";
import {TxnBuilderImpl} from "./transaction_builder";
import {DBBuilder, SignerSupplier} from "../core/builders";

export class DBBuilderImpl implements DBBuilder {
    private readonly client: Kwil;
    private _payload: Nillable<() => NonNil<object>> = null;
    private _signer: Nillable<SignerSupplier> = null;

    private constructor(client: Kwil) {
        this.client = client;
    }

    public static of(client: NonNil<Kwil>): NonNil<DBBuilder> {
        return new DBBuilderImpl(objects.requireNonNil(client));
    }

    signer(signer: SignerSupplier): NonNil<DBBuilder> {
        this._signer = objects.requireNonNil(signer);
        return this;
    }

    payload(payload: (() => NonNil<object>) | NonNil<object>): NonNil<DBBuilder> {
        this._payload = typeof objects.requireNonNil(payload) !== "function" ?
            () => payload :
            payload as () => NonNil<object>;

        return this;
    }

    async buildTx(): Promise<Transaction> {
        const signer = await awaitable(objects.requireNonNil(this._signer));

        return TxnBuilderImpl
            .of(this.client)
            .payloadType(PayloadType.DEPLOY_DATABASE)
            .payload(objects.requireNonNil(this._payload))
            .signer(objects.requireNonNil(signer))
            .build();
    }
}
