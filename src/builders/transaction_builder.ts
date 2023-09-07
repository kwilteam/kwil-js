import { HexString, Nillable, NonNil } from "../utils/types";
import { Transaction } from "../core/tx";
import { ethers, Signer } from "ethers";
import { objects } from "../utils/objects";
import { strings } from "../utils/strings";
import { Txn } from "../core/tx";
import { generateSalt, sha256BytesToBytes, sha384BytesToBytes } from "../utils/crypto";
import { base64ToBytes, bytesToBase64 } from "../utils/base64";
import { Kwil } from "../client/kwil";
import { EthSigner, NearSigner, SignerSupplier, TxnBuilder } from "../core/builders";
import { unwrap } from "../client/intern";
import { PayloadType, SerializationType } from "../core/enums";
import { kwilEncode } from "../utils/rlp";
import { base64ToHex, bytesToHex, bytesToString, hexToBase64, hexToBytes, stringToBytes, stringToHex } from "../utils/serial";
import { SignatureType } from "../core/signature";
import { Message, Msg } from "../core/message";
import { isNearPubKey, nearB58ToHex, ethSign, NearConfig, nearSign, isEthersSigner } from "../utils/keys";
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
    private _signatureType: Nillable<SignatureType> = null;
    private _nearConfig: Nillable<NearConfig> = null;
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

    signer(signer: SignerSupplier): NonNil<TxnBuilder> {
        this._signer = objects.requireNonNil(signer);
        this._signatureType = this.getSigType(signer);
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

    nearConfig(nearConfig: NearConfig): NonNil<TxnBuilder> {
        this._nearConfig = nearConfig;
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
        
        //TODO: Refactor so that we do signature first, then ecr recover and do the getaccount info
        const acct = await this.client.getAccount(this._publicKey);
        if (acct.status !== 200 || !acct.data) {
            throw new Error(`Could not retrieve account ${this._publicKey}. Please double check that you have the correct account address.`);
        }

        console.log('RAW PAYLOAD ===')
        console.log(util.inspect(json, false, null, true /* enable colors */))

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

        return TxnBuilderImpl.signTx(postEstTxn, signer, this._publicKey, this._signatureType, this._description, this._nearConfig ? this._nearConfig : undefined);
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
            if(!this._publicKey) {
                throw new Error("Public key is required to build a message that uses a signer.");
            }

            msg = Msg.copy(msg, msg => {
                msg.payload = base64ToBytes(msg.payload as string);
            });

            if(!this._signatureType) {
                throw new Error("Signature is required to build a signed message.");
            }
    
            if(this._signatureType === SignatureType.SIGNATURE_TYPE_INVALID) {
                throw new Error("Signature type is invalid.");
            }

            return await TxnBuilderImpl.signMsg(msg, signer, this._publicKey, this._signatureType, this._nearConfig ? this._nearConfig : undefined);
        }

        return msg;
    }

    private async preBuild(): Promise<PreBuild> {
        objects.requireNonNil(this.client);

        const payloadFn = objects.requireNonNil(this._payload);
        
        const signer = this._signer;

        if(signer) {
            this._signatureType = this.getSigType(signer); 
        }

        const json = objects.requireNonNil(payloadFn());

        return {
            json: json,
            signer: signer
        }
    }

    private static async signTx(tx: Transaction, signer: SignerSupplier, pubKey: Uint8Array, signatureType: SignatureType, description: string, nearConfig?: NearConfig): Promise<Transaction> {
        // convert payload back to uint8array for rlp encoding before signing
        // const preEncodedBody = Txn.copy(tx, (tx) => {
        //     tx.body.payload = base64ToBytes(tx.body.payload as string);
        //     tx.body.payload_type = tx.body.payload_type
        //     tx.body.fee = tx.body.fee
        //     tx.body.nonce = tx.body.nonce
        //     tx.body.salt = generateSalt(16)
        // })

        const salt = generateSalt(16);

   

        const digest = sha256BytesToBytes(base64ToBytes(tx.body.payload as string)).subarray(0, 20);

        const signatureMessage = `${description}

PayloadType: ${tx.body.payload_type}
PayloadDigest: ${bytesToHex(digest).slice(2)}
Fee: ${tx.body.fee}
Nonce: ${tx.body.nonce}
Salt: ${bytesToHex(salt).slice(2)}

Kwil 🖋
`

        let signedMessage: string;

        if (signatureType === SignatureType.SECP256K1_PERSONAL) {
            if(!isEthersSigner(signer)) {
                throw new Error("Wallet is not supported for secp256k1 personal signatures.");
            }

            signedMessage = await ethSign(signatureMessage, signer as EthSigner);
        }

        if (signatureType === SignatureType.ED25519_NEAR) {
            if(isEthersSigner(signer)) {
                throw new Error("Signer must be a Wallet for ed25519 signatures.");
            }

            const signature = await nearSign(signatureMessage, signer as NearSigner, objects.requireNonNil(nearConfig));
            signedMessage = bytesToHex(signature.signature);
        }

        return Txn.copy(tx, (newTx) => {
            newTx.signature = {
                signature_bytes: hexToBase64(signedMessage),
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

    // TODO: Fix signMsg
    private static async signMsg(msg: Message, signer: SignerSupplier, pubKey: Uint8Array, signatureType: SignatureType, nearConfig?: NearConfig): Promise<Message> {
        if(typeof msg.payload === "string") {
            throw new Error("Payload must be an object to sign a message.");
        }

        let signedMessage: HexString;
        const encodeMsg: Uint8Array = msg.payload;

        if(signatureType === SignatureType.SECP256K1_PERSONAL) {
            if(!isEthersSigner(signer)) {
                throw new Error("Wallet is not supported for secp256k1 personal signatures.");
            }
            signedMessage = await ethSign(encodeMsg, signer as EthSigner);
        }

        if(signatureType === SignatureType.ED25519_NEAR) {
            if(isEthersSigner(signer)) {
                throw new Error("Signer must be a Wallet for ed25519 signatures.");
            }
            const signature = await nearSign(encodeMsg, signer as NearSigner, objects.requireNonNil(nearConfig));
            signedMessage = bytesToHex(signature.signature);
        }


        return Msg.copy(msg, (msg) => {
            msg.payload = bytesToBase64(encodeMsg);
            msg.signature = {
                signature_bytes: bytesToBase64(hexToBytes(signedMessage)),
                signature_type: signatureType.toString() as SignatureType
            };
            msg.sender = bytesToBase64(pubKey);
        })
    }

    private getSigType(signer: SignerSupplier): SignatureType {
        if(isEthersSigner(signer))  {
            return SignatureType.SECP256K1_PERSONAL;
        }
        
   
        // TODO: Refactor to actually check if its a near signer, rather than just checking if its not an ethers signer...
        if(!isEthersSigner(signer)) {
            return SignatureType.ED25519_NEAR;
        }

        return SignatureType.SIGNATURE_TYPE_INVALID;
    }
}