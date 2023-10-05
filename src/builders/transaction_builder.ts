import { Nillable, NonNil } from "../utils/types";
import { Transaction } from "../core/tx";
import { objects } from "../utils/objects";
import { strings } from "../utils/strings";
import { Txn } from "../core/tx";
import { generateSalt, sha256BytesToBytes, sha384BytesToBytes } from "../utils/crypto";
import { base64ToBytes, bytesToBase64 } from "../utils/base64";
import { Kwil } from "../client/kwil";
import { SignerSupplier, TxnBuilder } from "../core/builders";
import { unwrap } from "../client/intern";
import { PayloadType, SerializationType } from "../core/enums";
import { kwilEncode } from "../utils/rlp";
import { base64ToHex, bytesToHex, bytesToString, hexToBase64, hexToBytes, stringToBytes, stringToHex } from "../utils/serial";
import { AnySignatureType, SignatureType, executeSign } from "../core/signature";
import { Message, Msg, UnencodedMessagePayload } from "../core/message";
import { isNearPubKey, nearB58ToHex } from "../utils/keys";
import util from 'util';

interface PreBuild {
    json: object;
    signer?: SignerSupplier | null;
};

export class TxnBuilderImpl implements TxnBuilder {
    private readonly client: Kwil;
    private _payloadType: Nillable<PayloadType> = null;
    private _payload: Nillable<() => NonNil<object>> = null;
    private _signer: Nillable<SignerSupplier> = null;
    private _publicKey: Nillable<Uint8Array> = null;
    private _signatureType: Nillable<AnySignatureType> = null;
    private _description: NonNil<string> = "";

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

    signer(signer: SignerSupplier, sigType: AnySignatureType): NonNil<TxnBuilder> {
        this._signer = objects.requireNonNil(signer);
        this._signatureType = objects.requireNonNil(sigType);
        return this;
    }

    payload(payload: (() => NonNil<object>) | NonNil<object>): NonNil<TxnBuilder> {
        this._payload = typeof objects.requireNonNil(payload) !== "function" ?
            () => payload :
            payload as () => NonNil<object>;

        return this;
    }

    publicKey(publicKey: Nillable<string | Uint8Array>): NonNil<TxnBuilder> {
        let key = objects.requireNonNil(publicKey);

        if(typeof key === "string") {
            if(isNearPubKey(key)) {
                key = nearB58ToHex(key);
            }

            key = hexToBytes(key);
        }

        this._publicKey = key;

        return this;
    }

    description(description: Nillable<string>): NonNil<TxnBuilder> {
        if(description) {
            this._description = description;
        }
        return this;
    }

    async buildTx(): Promise<Transaction> {
        const { json, signer } = await this.preBuild();

        if(!signer) {
            throw new Error("Signer is required to build a transaction.");
        }

        const payloadType = objects.requireNonNil(this._payloadType);

        if(!this._publicKey) {
            throw new Error("Public key is required to build a transaction. Please chain the .publicKey() method to your builder.");
        }
        
        const acct = await this.client.getAccount(this._publicKey);
        if (acct.status !== 200 || !acct.data) {
            throw new Error(`Could not retrieve account ${this._publicKey}. Please double check that you have the correct account address.`);
        }

        const preEstTxn = Txn.create(tx => {
            tx.body.payload = bytesToBase64(kwilEncode(json));
            tx.body.payload_type = payloadType;
            tx.body.fee = tx.body.fee.toString()
        });

        const cost = await unwrap(this.client)(preEstTxn);

        if (cost.status !== 200 || !cost.data) {
            throw new Error(`Could not retrieve cost for transaction. Please double check that you have the required fields.`);
        }

        // convert payload back to hex for rlp encoding before signing 
        const postEstTxn = Txn.copy(preEstTxn, tx => {
            tx.body.fee = BigInt(strings.requireNonNil(cost.data));
            tx.body.nonce = Number(objects.requireNonNil(acct.data?.nonce)) + 1;
        })

        if(!this._signatureType) {
            throw new Error("Signature is required to build a transaction.");
        }

        if(this._signatureType === SignatureType.SIGNATURE_TYPE_INVALID) {
            throw new Error("Signature type is invalid.");
        }

        return TxnBuilderImpl.signTx(postEstTxn, signer, this._publicKey, this._signatureType, this._description);
    }

    async buildMsg(): Promise<Message> {
        const { json, signer } = await this.preBuild();

        if(this._payloadType) {
            throw new Error("Payload type is not required to build a message.");
        }

        let msg = Msg.create(msg => {
            msg.body.payload = json as UnencodedMessagePayload;
        });

        if(signer) {
            if(!this._publicKey) {
                throw new Error("Public key is required to build a message that uses a signer.");
            }

            if(!this._signatureType) {
                throw new Error("Signature is required to build a signed message.");
            }
    
            if(this._signatureType === SignatureType.SIGNATURE_TYPE_INVALID) {
                throw new Error("Signature type is invalid.");
            }

            return await TxnBuilderImpl.signMsg(msg, signer, this._publicKey, this._signatureType, this._description);
        }

        return msg = Msg.copy(msg, msg => {
            msg.body.payload = bytesToBase64(kwilEncode(json));
        });
    }

    private async preBuild(): Promise<PreBuild> {
        objects.requireNonNil(this.client);

        const payloadFn = objects.requireNonNil(this._payload);
        const signer = this._signer;

        const json = objects.requireNonNil(payloadFn());

        return {
            json: json,
            signer: signer
        }
    }

    private static async signTx(tx: Transaction, signer: SignerSupplier, pubKey: Uint8Array, signatureType: AnySignatureType, description: string): Promise<Transaction> {
        const salt = generateSalt(16);

        const digest = sha256BytesToBytes(base64ToBytes(tx.body.payload as string)).subarray(0, 20);

        const signatureMessage = `${description}

PayloadType: ${tx.body.payload_type}
PayloadDigest: ${bytesToHex(digest)}
Fee: ${tx.body.fee}
Nonce: ${tx.body.nonce}
Salt: ${bytesToHex(salt)}

Kwil 🖋
`

        const signedMessage = await executeSign(stringToBytes(signatureMessage), signer, signatureType)

        return Txn.copy(tx, (newTx) => {
            newTx.signature = {
                signature_bytes: bytesToBase64(signedMessage),
                signature_type: signatureType.toString() as SignatureType
            };
            newTx.body = {
                description: description,
                payload: newTx.body.payload,
                payload_type: newTx.body.payload_type as PayloadType,
                fee: newTx.body.fee.toString(),
                nonce: newTx.body.nonce,
                salt: bytesToBase64(salt),
            };
            newTx.sender = bytesToBase64(pubKey);
            newTx.serialization = SerializationType.SIGNED_MSG_CONCAT;
        });
    }

    private static async signMsg(msg: Message, signer: SignerSupplier, pubKey: Uint8Array, signatureType: AnySignatureType, description: string): Promise<Message> {
        if(typeof msg.body.payload === "string") {
            throw new Error("Payload must be an object to sign a message.");
        }

        const encodedPayload = kwilEncode(msg.body.payload);

        const digest = sha256BytesToBytes(encodedPayload).subarray(0, 20);

        const signatureMessage = `${description}

DBID: ${msg.body.payload.dbid}
Action: ${msg.body.payload.action}
PayloadDigest: ${bytesToHex(digest)}

Kwil 🖋
`
        const signedMessage = await executeSign(stringToBytes(signatureMessage), signer, signatureType);

        return Msg.copy(msg, (msg) => {
            msg.body.payload = bytesToBase64(encodedPayload);
            msg.body.description = description;
            msg.signature = {
                signature_bytes: bytesToBase64(signedMessage),
                signature_type: signatureType.toString() as SignatureType
            };
            msg.sender = bytesToBase64(pubKey);
            msg.serialization = SerializationType.SIGNED_MSG_CONCAT;
        })
    }
}