import {Nillable, NonNil, Promisy} from "../utils/types";
import {PayloadType, Transaction} from "../core/tx";
import {ethers, Signer} from "ethers";
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
import {Wallet as Walletv5, Signer as Signerv5} from "ethers5"
import { Message, Msg } from "../core/message";

interface PreBuild {
    json: object;
    sender: string;
    signer?: SignerSupplier | null;
};

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

    async buildTx(): Promise<Transaction> {
        const { json, sender, signer } = await this.preBuild();

        if(!signer) {
            throw new Error("Signer is required to build a transaction.");
        }

        const payloadType = objects.requireNonNil(this._payloadType);
        
        const acct = await this.client.getAccount(sender);
        if (acct.status !== 200 || !acct.data) {
            throw new Error(`Could not retrieve account ${sender}. Please double check that you have the correct account address.`);
        }

        const preEstTxn = Txn.create(tx => {
            tx.sender = sender;
            tx.payload = MarshalB64(json);
            tx.payload_type = payloadType;
        });

        const cost = await unwrap(this.client)(preEstTxn);
        
        if (cost.status !== 200 || !cost.data) {
            throw new Error(`Could not retrieve cost for transaction. Please double check that you have the correct account address.`);
        }

        const postEstTxn = Txn.copy(preEstTxn, tx => {
            tx.fee = strings.requireNonNil(cost.data);
            tx.nonce = Number(objects.requireNonNil(acct.data?.nonce)) + 1;
        })

        return TxnBuilderImpl.signTx(postEstTxn, signer);
    }

    async buildMsg(): Promise<Message> {
        const { json, sender, signer } = await this.preBuild();

        if(this._payloadType) {
            throw new Error("Payload type is not required to build a message.");
        }

        let msg = Msg.create(msg => {
            msg.sender = sender;
            msg.payload = MarshalB64(json);
        });

        if(signer) {
            return await TxnBuilderImpl.signMsg(msg, signer);
        }

        return msg;
    }

    private async preBuild(): Promise<PreBuild> {
        objects.requireNonNil(this.client);

        const payloadFn = objects.requireNonNil(this._payload);
        const signer = this._signer;
        const sender = signer ? (await signer.getAddress()).toLowerCase() : "";

        const json = objects.requireNonNil(payloadFn());

        return {
            json: json,
            sender: sender,
            signer: signer
        }
    }

    private static async signTx(tx: Transaction, signer: Signer | ethers.Wallet | Walletv5 | Signerv5): Promise<Transaction> {
        const hash = TxnBuilderImpl.hash_txn(tx);
        const signature = await crypto_sign(hash, signer);
        const sender = await signer.getAddress();

        return Txn.copy(tx, (tx) => {
            tx.signature = signature;
            tx.sender = sender;
            tx.hash = hash;
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

    private static async signMsg(msg: Message, signer: Signer | ethers.Wallet | Walletv5 | Signerv5): Promise<Message> {
        const hash = TxnBuilderImpl.hash_msg(msg);
        const signature = await crypto_sign(hash, signer);
        const sender = await signer.getAddress();

        return Msg.copy(msg, (msg) => {
            msg.signature = signature;
            msg.sender = sender;
        })
    }

    private static hash_msg(msg: NonNil<Message>): string {
        const payloadHash = sha384BytesToBytes(base64ToBytes(msg.payload));
        return bytesToBase64(payloadHash);
    }
}