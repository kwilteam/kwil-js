import {awaitable, Nillable, NonNil} from "../utils/types";
import {PayloadType, Transaction} from "../core/tx";
import {ethers, JsonRpcSigner} from "ethers";
import {objects} from "../utils/objects";
import {
    ConcatBytes,
    MarshalB64,
    NumberToUint32LittleEndian,
    NumberToUint64LittleEndian,
    StringToUint8LittleEndian
} from "../utils/bytes";
import {strings} from "../utils/strings";
import {Txn} from "../core/tx";
import {sha384BytesToBytes, sign as crypto_sign} from "../utils/crypto";
import {base64ToBytes, bytesToBase64} from "../utils/base64";
import {Kwil} from "../client/kwil";
import {SignerSupplier, TxnBuilder} from "../core/builders";
import {unwrap} from "../client/intern";

export class TxnBuilderImpl implements TxnBuilder {
    private readonly client: Kwil;
    private _payloadType: Nillable<PayloadType> = null;
    private _payload: Nillable<() => NonNil<object>> = null;
    private _signer: Nillable<SignerSupplier> = null;

    private constructor(client: Kwil) {
        this.client = objects.requireNonNil(client);
    }

    payloadType(payloadType: NonNil<PayloadType>): TxnBuilder {
        this._payloadType = objects.requireNonNil(payloadType);
        return this;
    }

    public static of(client:  NonNil<Kwil>): NonNil<TxnBuilder> {
        return new TxnBuilderImpl(client);
    }

    signer(signer: SignerSupplier): NonNil<TxnBuilder> {
        this._signer = objects.requireNonNil(signer);
        return this;
    }

    payload(payload: (() => NonNil<object>) | NonNil<object>): NonNil<TxnBuilder> {
        this._payload = typeof objects.requireNonNil(payload) !== "function" ?
            () => payload :
            payload as () => NonNil<object>;

        return this;
    }

    async build(): Promise<Transaction> {
        objects.requireNonNil(this.client);

        const payloadFn = objects.requireNonNil(this._payload);
        const payloadType = objects.requireNonNil(this._payloadType);
        const signer = await awaitable(objects.requireNonNil(this._signer));
        const sender = (await signer.getAddress()).toLowerCase();
        const acct = await this.client.getAccount(sender);
        if (acct.status !== 200 || !acct.data) {
            throw new Error(`Could not retrieve account ${sender}. Please double check that you have the correct account address.`);
        }

        const json = objects.requireNonNil(payloadFn());
        const preEstTxn = Txn.create(tx => {
            tx.sender = sender;
            tx.payload = MarshalB64(json);
            tx.payload_type = payloadType;
        });

        const cost = await unwrap(this.client)(preEstTxn);
        if (cost.status !== 200 || !cost.data) {
            throw new Error(`Could not retrieve cost for transaction. Please double check that you have the correct account address.`);
        }

        const postEstTxn = preEstTxn.copy(tx => {
            tx.fee = strings.requireNonNil(cost.data);
            tx.nonce = Number(objects.requireNonNil(acct.data?.nonce)) + 1;
        })

        return TxnBuilderImpl.sign(postEstTxn, signer);
    }

    private static async sign(tx: Transaction, signer: JsonRpcSigner | ethers.Wallet): Promise<Transaction> {
        const hash = TxnBuilderImpl.hash_txn(tx);
        const signature = await crypto_sign(hash, signer);
        const sender = await signer.getAddress();

        return tx.copy((tx) => {
            (tx as any).isSigned = () => true
            tx.signature = signature;
            tx.sender = sender;
        });
    }

    private static hash_txn(tx: NonNil<Transaction>): string {
        const payloadType = NumberToUint32LittleEndian(tx.payload_type);
        const payloadHash = sha384BytesToBytes(base64ToBytes(tx.payload));
        const fee = StringToUint8LittleEndian(tx.fee);
        const nonce = NumberToUint64LittleEndian(tx.nonce);
        const hash = sha384BytesToBytes(ConcatBytes(payloadType, payloadHash, fee, nonce));
        return bytesToBase64(hash);
    }
}