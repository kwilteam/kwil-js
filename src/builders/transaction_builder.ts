import { Nillable, NonNil } from "../utils/types";
import { Transaction } from "../core/tx";
import { ethers, Signer } from "ethers";
import { objects } from "../utils/objects";
import { strings } from "../utils/strings";
import { Txn } from "../core/tx";
import { sign as crypto_sign, ecrRecoverPubKey, generateSalt } from "../utils/crypto";
import { base64ToBytes, bytesToBase64 } from "../utils/base64";
import { Kwil } from "../client/kwil";
import { SignerSupplier, TxnBuilder } from "../core/builders";
import { unwrap } from "../client/intern";
import { Wallet as Walletv5, Signer as Signerv5 } from "ethers5"
import { PayloadType } from "../core/enums";
import { kwilEncode } from "../utils/rlp";
import { hexToBytes } from "../utils/serial";
import { SignatureType } from "../core/signature";
import { Message, Msg } from "../core/message";

interface PreBuild {
    json: object;
    address: string;
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

    async buildTx(): Promise<Transaction> {
        const { json, address, signer } = await this.preBuild();

        if(!signer) {
            throw new Error("Signer is required to build a transaction.");
        }

        const payloadType = objects.requireNonNil(this._payloadType);
        
        const acct = await this.client.getAccount(address);
        if (acct.status !== 200 || !acct.data) {
            throw new Error(`Could not retrieve account ${address}. Please double check that you have the correct account address.`);
        }

        const preEstTxn = Txn.create(tx => {
            tx.body.payload = bytesToBase64(kwilEncode(json));
            tx.body.payload_type = payloadType;
            tx.body.fee = tx.body.fee.toString()
        });

        console.log('PRE EST TXN', preEstTxn)

        const cost = await unwrap(this.client)(preEstTxn);

        if (cost.status !== 200 || !cost.data) {
            throw new Error(`Could not retrieve cost for transaction. Please double check that you have the correct account address.`);
        }

        // convert payload back to hex for rlp encoding before signing 
        const postEstTxn = Txn.copy(preEstTxn, tx => {
            tx.body.fee = BigInt(strings.requireNonNil(cost.data));
            tx.body.nonce = Number(objects.requireNonNil(acct.data?.nonce)) + 1;
        })

        return TxnBuilderImpl.signTx(postEstTxn, signer);
    }

    async buildMsg(): Promise<Message> {
        const { json, signer } = await this.preBuild();

        if(this._payloadType) {
            throw new Error("Payload type is not required to build a message.");
        }

        let msg = Msg.create(msg => {
            msg.sender = '';
            msg.payload = bytesToBase64(kwilEncode(json));
        });

        if(signer) {
            msg = Msg.copy(msg, msg => {
                msg.payload = base64ToBytes(msg.payload as string);
            });
            return await TxnBuilderImpl.signMsg(msg, signer);
        }

        return msg;
    }

    private async preBuild(): Promise<PreBuild> {
        objects.requireNonNil(this.client);

        const payloadFn = objects.requireNonNil(this._payload);
        const signer = this._signer;
        const address = signer ? (await signer.getAddress()).toLowerCase() : "";

        const json = objects.requireNonNil(payloadFn());

        return {
            json: json,
            address: address,
            signer: signer
        }
    }

    private static async signTx(tx: Transaction, signer: Signer | ethers.Wallet | Walletv5 | Signerv5): Promise<Transaction> {
        // convert payload back to uint8array for rlp encoding before signing
        const preEncodedBody = Txn.copy(tx, (tx) => {
            tx.body.payload = base64ToBytes(tx.body.payload as string);
            tx.body.payload_type = tx.body.payload_type
            tx.body.fee = tx.body.fee
            tx.body.nonce = tx.body.nonce
            tx.body.salt = generateSalt(16);
        })

        const encodedTx = kwilEncode(preEncodedBody.body);
        const signedMessage = await crypto_sign(encodedTx, signer);
        const pubKey = ecrRecoverPubKey(encodedTx, signedMessage);

        // for testing purposes
        const hardCodedKey = '0x048767310544592e33b2fb5555527f49c0902cf0f472f4c87e65324abb75e7a5e1c035bc1ef5026f363c79588526c341af341a68fc37299183391699ee1864cc75'
        console.log('GOT CORRECT PUB KEY', pubKey === hardCodedKey)
        
        return Txn.copy(preEncodedBody, (tx) => {
            tx.signature = {
                signature_bytes: bytesToBase64(hexToBytes(signedMessage)),
                signature_type: SignatureType.SECP256K1_PERSONAL.toString() as SignatureType
            };
            tx.body = {
                payload: bytesToBase64(tx.body.payload as Uint8Array),
                payload_type: tx.body.payload_type as PayloadType,
                fee: tx.body.fee.toString(),
                nonce: tx.body.nonce,
                salt: bytesToBase64(tx.body.salt as Uint8Array)
            };
            tx.sender = bytesToBase64(hexToBytes(pubKey));
        });
    }

    // TODO: Fix signMsg
    private static async signMsg(msg: Message, signer: Signer | ethers.Wallet | Walletv5 | Signerv5): Promise<Message> {
        if(typeof msg.payload === "string") {
            throw new Error("Payload must be an object to sign a message.");
        }

        const encodeMsg: Uint8Array = msg.payload;
        const signedMessage = await crypto_sign(encodeMsg, signer);
        const pubKey = ecrRecoverPubKey(encodeMsg, signedMessage);

        return Msg.copy(msg, (msg) => {
            msg.payload = bytesToBase64(encodeMsg);
            msg.signature = {
                signature_bytes: bytesToBase64(hexToBytes(signedMessage)),
                signature_type: SignatureType.SECP256K1_PERSONAL.toString() as SignatureType
            };
            msg.sender = bytesToBase64(hexToBytes(pubKey));
        })
    }
}