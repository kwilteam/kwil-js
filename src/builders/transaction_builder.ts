import { HexString, Nillable, NonNil } from "../utils/types";
import { Transaction } from "../core/tx";
import { ethers, Signer } from "ethers";
import { objects } from "../utils/objects";
import { strings } from "../utils/strings";
import { Txn } from "../core/tx";
import { ethSign, ecrRecoverPubKey, generateSalt, isV6Signer, nearSign, isEthersSigner } from "../utils/crypto";
import { base64ToBytes, bytesToBase64 } from "../utils/base64";
import { Kwil } from "../client/kwil";
import { EthSigner, NearConfig, NearSigner, SignerSupplier, TxnBuilder } from "../core/builders";
import { unwrap } from "../client/intern";
import { Wallet as Walletv5, Signer as Signerv5 } from "ethers5"
import { PayloadType } from "../core/enums";
import { kwilEncode } from "../utils/rlp";
import { bytesToHex, bytesToString, hexToBytes } from "../utils/serial";
import { SignatureType } from "../core/signature";
import { Message, Msg } from "../core/message";
import { Wallet as NearWallet } from '@near-wallet-selector/core'

interface PreBuild {
    json: object;
    signer?: SignerSupplier | null;
};

export class TxnBuilderImpl implements TxnBuilder {
    private readonly client: Kwil;
    private _payloadType: Nillable<PayloadType> = null;
    private _payload: Nillable<() => NonNil<object>> = null;
    private _signer: Nillable<SignerSupplier> = null;
    private _publicKey: Nillable<string> = null;
    private _signatureType: Nillable<SignatureType> = null;
    private _nearConfig: Nillable<NearConfig> = null;

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

    publicKey(publicKey: Nillable<string>): NonNil<TxnBuilder> {
        this._publicKey = publicKey;
        return this;
    }

    nearConfig(nearConfig: NearConfig): NonNil<TxnBuilder> {
        this._nearConfig = nearConfig;
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

        return TxnBuilderImpl.signTx(postEstTxn, signer, this._publicKey, this._signatureType, this._nearConfig ? this._nearConfig : undefined);
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

    private static async signTx(tx: Transaction, signer: SignerSupplier, pubKey: string, signatureType: SignatureType, nearConfig?: NearConfig): Promise<Transaction> {
        // convert payload back to uint8array for rlp encoding before signing
        const preEncodedBody = Txn.copy(tx, (tx) => {
            tx.body.payload = base64ToBytes(tx.body.payload as string);
            tx.body.payload_type = tx.body.payload_type
            tx.body.fee = tx.body.fee
            tx.body.nonce = tx.body.nonce
            tx.body.salt = new Uint8Array();
        })

        const encodedTx = kwilEncode(preEncodedBody.body);
        let signedMessage: string;

        if (signatureType === SignatureType.SECP256K1_PERSONAL) {
            if(!isEthersSigner(signer)) {
                throw new Error("Wallet is not supported for secp256k1 personal signatures.");
            }

            signedMessage = await ethSign(encodedTx, signer as EthSigner);
        }

        if (signatureType === SignatureType.ED25519_NEAR) {
            if(isEthersSigner(signer)) {
                throw new Error("Signer must be a Wallet for ed25519 signatures.");
            }

            console.log('preencoded body', preEncodedBody.body)
            const signature = await nearSign(encodedTx, signer as NearSigner, objects.requireNonNil(nearConfig));
            signedMessage = bytesToHex(signature.signature);
        }

        return Txn.copy(preEncodedBody, (tx) => {
            tx.signature = {
                signature_bytes: bytesToBase64(hexToBytes(signedMessage)),
                signature_type: signatureType.toString() as SignatureType
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
    private static async signMsg(msg: Message, signer: SignerSupplier, pubKey: string, signatureType: SignatureType, nearConfig?: NearConfig): Promise<Message> {
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
            msg.sender = bytesToBase64(hexToBytes(pubKey));
        })
    }

    private getSigType(signer: SignerSupplier): SignatureType {
        if(isEthersSigner(signer))  {
            return SignatureType.SECP256K1_PERSONAL;
        }
        
   
        if(!isEthersSigner(signer)) {
            return SignatureType.ED25519_NEAR;
        }

        return SignatureType.SIGNATURE_TYPE_INVALID;
    }

    // private async resolvePublicKey(signer: SignerSupplier): Promise<void> {
    //     if(this._signatureType === SignatureType.SECP256K1_PERSONAL && !this._publicKey) {
    //         throw new Error("Public key is required for secp256k1 personal signatures. Please pass an uncompressed Secp256k1 public key to the .secp256k1PubKey() method.");
    //     }

    //     //@ts-ignore
    //     if(this._signatureType === SignatureType.ED25519_NEAR && signer.verifyOwner) {
    //         //@ts-ignore
    //         this._publicKey = signer.getPublicKey().toString().slice(8);
    //         //@ts-ignore
    //         console.log('NEAR PUB KEY', signer.getPublicKey().toString())
    //     }

    //     if(!this._publicKey) {
    //         throw new Error('Could not resolve public key.')
    //     }
    // }
}