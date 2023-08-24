import { Nillable, NonNil, Promisy } from "../utils/types";
import { Transaction } from "../core/tx";
import { ethers, Signer } from "ethers";
import { objects } from "../utils/objects";
import { strings } from "../utils/strings";
import { Txn } from "../core/tx";
import { buildSignaturePayload, sign as crypto_sign, ecrRecoverPubKey, generateSalt } from "../utils/crypto";
import { base64ToBytes, bytesToBase64 } from "../utils/base64";
import { Kwil } from "../client/kwil";
import { SignerSupplier, TxnBuilder } from "../core/builders";
import { unwrap } from "../client/intern";
import { Wallet as Walletv5, Signer as Signerv5 } from "ethers5"
import { EncodingType, PayloadType } from "../core/enums";
import { kwilEncode } from "../utils/rlp";
import { HexToBytes, StringToBytes } from "../utils/serial";

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
        const encodedTx = kwilEncode(tx.body);
        const signedMessage = await crypto_sign(encodedTx, signer);
        console.log('SIGNED MESSAGE ====', signedMessage)
        const signature = buildSignaturePayload(signedMessage);
        const pubKey = ecrRecoverPubKey(base64ToBytes(encodedTx), signedMessage);
        console.log('PUBKEY ====', pubKey)

        const hardCodedKey = '0x048767310544592e33b2fb5555527f49c0902cf0f472f4c87e65324abb75e7a5e1c035bc1ef5026f363c79588526c341af341a68fc37299183391699ee1864cc75'
        console.log('GOT CORRECT PUB KEY', pubKey === hardCodedKey)
        return Txn.copy(tx, (tx) => {
            tx.signature = signature;
            tx.sender = bytesToBase64(HexToBytes(pubKey));
        });
    }
}