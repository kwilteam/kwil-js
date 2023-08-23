import { Nillable, NonNil, Promisy } from "../utils/types";
import { Transaction } from "../core/tx";
import { ethers, Signer } from "ethers";
import { objects } from "../utils/objects";
import {
    ConcatBytes,
    Marshal,
    NumberToUint16BigEndian,
    NumberToUint32LittleEndian,
    NumberToUint64LittleEndian,
} from "../utils/bytes";
import { strings } from "../utils/strings";
import { Txn } from "../core/tx";
import { sha384BytesToBytes, sign as crypto_sign, generateSalt } from "../utils/crypto";
import { base64ToBytes, bytesToBase64 } from "../utils/base64";
import { Kwil } from "../client/kwil";
import { SignerSupplier, TxnBuilder } from "../core/builders";
import { unwrap } from "../client/intern";
import { Wallet as Walletv5, Signer as Signerv5 } from "ethers5"
import { EncodingType, PayloadType } from "../core/enums";
import { BytesToHex, HexToBytes } from "../utils/serial";
import { encodeRlp } from "ethers";
import { kwilEncode } from "../utils/rlp";

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

    public static of(client: NonNil<Kwil>): NonNil<TxnBuilder> {
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
        const signer = await Promisy.resolveOrReject(this._signer);
        const sender = (await signer.getAddress()).toLowerCase();
        const acct = await this.client.getAccount(sender);
        if (acct.status !== 200 || !acct.data) {
            throw new Error(`Could not retrieve account ${sender}. Please double check that you have the correct account address.`);
        }

        const json = objects.requireNonNil(payloadFn());
        const preEstTxn = Txn.create(tx => {
            tx.sender = sender;
            tx.body.payload = kwilEncode(json);
            tx.body.payload_type = payloadType;
            tx.body.salt = bytesToBase64(generateSalt(32));
        });

        console.log('PRE EST TXN', preEstTxn)

        const cost = await unwrap(this.client)(preEstTxn);

        if (cost.status !== 200 || !cost.data) {
            throw new Error(`Could not retrieve cost for transaction. Please double check that you have the correct account address.`);
        }

        const postEstTxn = Txn.copy(preEstTxn, tx => {
            tx.body.fee = strings.requireNonNil(cost.data);
            tx.body.nonce = Number(objects.requireNonNil(acct.data?.nonce)) + 1;
        })

        return TxnBuilderImpl.sign(postEstTxn, signer);
    }

    private static async sign(tx: Transaction, signer: Signer | ethers.Wallet | Walletv5 | Signerv5): Promise<Transaction> {
        const encodedTx = kwilEncode(tx);
        const signature = await crypto_sign(encodedTx, signer);
        const sender = await signer.getAddress();

        return Txn.copy(tx, (tx) => {
            tx.signature = signature;
            tx.sender = sender;
        });
    }

    private static kwil_rlp_encode(obj: NonNil<object>): string {
        const uint8: Uint8Array = Marshal(obj);
        const hex: string = BytesToHex(uint8);
        const rlpHex: string = encodeRlp(hex);
        const rlpBytes: Uint8Array = HexToBytes(rlpHex);
        const encodingType: Uint8Array = NumberToUint16BigEndian(EncodingType.RLP_ENCODING);
        const encodedByteArray = ConcatBytes(encodingType, rlpBytes);
        return bytesToBase64(encodedByteArray);
    }
}