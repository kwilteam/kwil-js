import { Nillable, NonNil, Promisy } from "../utils/types";
import { Transaction } from "../core/tx";
import { ethers, Signer } from "ethers";
import { objects } from "../utils/objects";
import { strings } from "../utils/strings";
import { Txn } from "../core/tx";
import { sign as crypto_sign, ecrRecoverPubKey, encodeSignature, generateSalt } from "../utils/crypto";
import { base64ToBytes, bytesToBase64 } from "../utils/base64";
import { Kwil } from "../client/kwil";
import { SignerSupplier, TxnBuilder } from "../core/builders";
import { unwrap } from "../client/intern";
import { Wallet as Walletv5, Signer as Signerv5 } from "ethers5"
import { PayloadType } from "../core/enums";
import { kwilEncode } from "../utils/rlp";
import { BytesToHex, BytesToString, HexToBytes, HexToNumber, HexToString, NumberToHex, StringToBytes, StringToHex, recursivelyHexlify } from "../utils/serial";
import { SignatureType } from "../core/signature";
import { HexToUint8Array } from "../utils/bytes";
import util from 'util'

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

        // const hexObj = recursivelyHexlify(json);

        // have to make the payload base64 so estimate cost can process it over GRPC
        const preEstTxn = Txn.create(tx => {
            tx.body.payload = bytesToBase64(kwilEncode(json as object));
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

        return TxnBuilderImpl.sign(postEstTxn, signer);
    }

    private static async sign(tx: Transaction, signer: Signer | ethers.Wallet | Walletv5 | Signerv5): Promise<Transaction> {

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
                signature_bytes: bytesToBase64(HexToBytes(signedMessage)),
                signature_type: SignatureType.SECP256K1_PERSONAL
            };
            tx.body = {
                payload: bytesToBase64(tx.body.payload as Uint8Array),
                payload_type: tx.body.payload_type as PayloadType,
                fee: tx.body.fee.toString(),
                nonce: tx.body.nonce,
                salt: bytesToBase64(tx.body.salt as Uint8Array)
            };
            tx.sender = bytesToBase64(HexToBytes(pubKey));
        });
    }
}