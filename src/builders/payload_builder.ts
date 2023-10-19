import { HexString, Nillable, NonNil } from "../utils/types";
import { BaseTransaction, Transaction } from "../core/tx";
import { objects } from "../utils/objects";
import { strings } from "../utils/strings";
import { Txn } from "../core/tx";
import { generateSalt, sha256BytesToBytes } from "../utils/crypto";
import { base64ToBytes, bytesToBase64 } from "../utils/base64";
import { Kwil } from "../client/kwil";
import { SignerSupplier, PayloadBuilder as PayloadBuilder } from "../core/builders";
import { unwrap } from "../client/intern";
import { BytesEncodingStatus, PayloadType, SerializationType } from "../core/enums";
import { kwilEncode } from "../utils/rlp";
import { bytesToHex, hexToBytes, stringToBytes } from "../utils/serial";
import { AnySignatureType, SignatureType, executeSign } from "../core/signature";
import { BaseMessage, Message, Msg } from "../core/message";
import { isNearPubKey, nearB58ToHex } from "../utils/keys";
import { AllPayloads, UnencodedActionPayload } from "../core/payload";

/**
 * PayloadBuilderImpl is the default implementation of PayloadBuilder. It allows for building transaction and call payloads that can be sent over GRPC.
 * See the proto files for more information on the structure of the payloads. {@link https://github.com/kwilteam/proto/tree/main/kwil/tx/v1}
 */
export class PayloadBuilderImpl implements PayloadBuilder {
    private readonly client: Kwil;
    private _payloadType: Nillable<PayloadType> = null;
    private _payload: Nillable<() => NonNil<AllPayloads>> = null;
    private _signer: Nillable<SignerSupplier> = null;
    private _publicKey: Nillable<Uint8Array> = null;
    private _signatureType: Nillable<AnySignatureType> = null;
    private _description: NonNil<string> = "";

    /**
     * Initializes a new `PayloadBuilder` instance.
     * 
     * @param {Kwil} client - The Kwil client, used to call higher level methods on the Kwil class.
     * @returns {PayloadBuilderImpl} - A new `PayloadBuilder` instance.
     */
    private constructor(client: Kwil) {
        this.client = objects.requireNonNil(client, 'client is required for TxnBuilder. Please pass a valid Kwil client. This is an internal error, please create an issue.');
    }

    /**
     * Creates a new `PayloadBuilder` instance.
     * 
     * @param {Kwil} client - The Kwil client, used to call higher level methods on the Kwil class.
     * @returns {PayloadBuilder} - A new `PayloadBuilder` instance.
     */
    public static of(client: NonNil<Kwil>): NonNil<PayloadBuilder> {
        return new PayloadBuilderImpl(client);
    }

    /**
     * Specify the payload type to be built.
     * 
     * @param {PayloadType} payloadType - The payload type to be built. See {@link PayloadType} for more information.
     * @returns {PayloadBuilder} - The current `PayloadBuilder` instance for chaining.
     * @throws {Error} - If the payload type is null or undefined.
     */
    payloadType(payloadType: NonNil<PayloadType>): PayloadBuilder {
        // throw runtime error if payload type is null or undefined
        this._payloadType = objects.requireNonNil(payloadType, "payload type is required to build a transaction.");
        return this;
    }

    /**
     * Specify the signer and the signature type.
     * 
     * @param {SignerSupplier} signer - The signer to be used to sign the transaction.
     * @param {AnySignatureType} sigType - The signature type to be used to sign the transaction. See {@link SignatureType} for more information.
     * @returns The current `PayloadBuilder` instance for chaining.
     * @throws {Error} - If the signer is null or undefined.
     * @throws {Error} - If the signature type is null or undefined.
     */
    signer(signer: SignerSupplier, sigType: AnySignatureType): NonNil<PayloadBuilder> {
        // throw runtime errors if signer or signature type are null or undefined
        this._signer = objects.requireNonNil(signer);
        this._signatureType = objects.requireNonNil(sigType, "signature type is required to build a transaction.");
        return this;
    }

    /**
     * Sets the content for the body of the payload object.
     * 
     * @param {() => NonNil<AllPayloads> | NonNil<AllPayloads>} payload - The payload to be built. This can be a function that returns an object or an object.
     * @returns {PayloadBuilder} - The current `PayloadBuilder` instance for chaining.
     * @throws {Error} - If the payload is null or undefined.
     */
    payload(payload: (() => NonNil<AllPayloads>) | NonNil<AllPayloads>): NonNil<PayloadBuilder> {
        // throw runtime error if payload is null or undefined
        const ensuredPayload = objects.requireNonNil(payload, "transaction payload cannot be null.");

        // ensure payload is a function for lazy evaluation
        this._payload = typeof ensuredPayload !== "function" ?
            () => ensuredPayload :
            ensuredPayload as () => NonNil<AllPayloads>;

        return this;
    }

    /**
     * Specify the public key for the payload signer.
     * 
     * @param {HexString | Uint8Array} publicKey - The public key to be used to sign the transaction. This can be a hex string or a Uint8Array.
     * @returns {PayloadBuilder} - The current `PayloadBuilder` instance for chaining.
     * @throws {Error} - If the public key is null or undefined.
     */
    publicKey(publicKey: Nillable<HexString | Uint8Array>): NonNil<PayloadBuilder> {
        // throw runtime error if public key is null or undefined
        let key = objects.requireNonNil(publicKey, "public key is required to build a transaction.");

        // if near is string, convert to hex
        if(typeof key === "string") {
            // accept near keys in their native format: ed25519:<base-58>
            if(isNearPubKey(key)) {
                key = nearB58ToHex(key);
            }

            // convert hex string to bytes
            key = hexToBytes(key);
        }

        this._publicKey = key;

        return this;
    }

    /**
     * Set the description to be included in the payload signature.
     * 
     * @param {string | null} description - The description to be included in the payload signature.
     * @returns {PayloadBuilder} - The current `PayloadBuilder` instance for chaining.
     */
    description(description: Nillable<string>): NonNil<PayloadBuilder> {
        // assign description if it is not null or undefined
        // we do not want to throw an error if null because description is optional. The default value is empty string.
        if(description) {
            this._description = description;
        }
        return this;
    }

    /**
     * Builds the payload for the `kwil.broadcast()` method (i.e. the broadcast GRPC endpoint - see {@link https://github.com/kwilteam/proto/blob/main/kwil/tx/v1/tx.proto})
     * 
     * @returns {BaseTransaction} - A promise that resolves to the signed transaction.
     * @throws {Error} - If the required fields in the builder are null or undefined.
     */
    async buildTx(): Promise<Transaction> {
        // complete lazy evaluation of payload
        const resolvedPayload = await this.resolvePayload();

        // ensure required fields are not null or undefined
        const signer = objects.requireNonNil(this._signer, "signer is required to build a transaction.")
        const payloadType = objects.requireNonNil(this._payloadType, "payload type is required to build a transaction.");
        const publicKey = objects.requireNonNil(this._publicKey, "public key is required to build a transaction. Please chain the .publicKey() method to your builder.");
        const signatureType = objects.requireNonNil(this._signatureType, "signature type is required to build a transaction.");

        // create transaction payload for estimating cost. Set the Tx bytes type to base64 encoded because we need to make GRPC estimate cost request.
        const preEstTxn = Txn.create<BytesEncodingStatus.BASE64_ENCODED>(tx => {
            // rlp encode the payload and convert to base64
            tx.body.payload = bytesToBase64(kwilEncode(resolvedPayload));
            tx.body.payload_type = payloadType;
        });

        // estimate the cost of the transaction with the estimateCost symbol from the client
        const cost = await unwrap(this.client)(preEstTxn);

        // retrieve the account for the nonce
        const acct = await this.client.getAccount(publicKey);
        
        // add the nonce and fee to the transaction. Set the tx bytes back to uint8 so we can do the signature.
        const postEstTxn = Txn.copy<BytesEncodingStatus.UINT8_ENCODED>(preEstTxn, tx => {
            tx.body.payload = base64ToBytes(preEstTxn.body.payload as string);
            tx.body.fee = BigInt(strings.requireNonNil(cost.data, 'something went wrong estimating the cost of your transaction.'));
            tx.body.nonce = Number(objects.requireNonNil(acct.data?.nonce, 'something went wrong retrieving your account nonce.')) + 1;
        })

        // check that a valid signature is used
        if(signatureType=== SignatureType.SIGNATURE_TYPE_INVALID) {
            throw new Error("Signature type is invalid.");
        }

        return PayloadBuilderImpl.signTx(postEstTxn, signer, publicKey, signatureType, this._description);
    }

    /**
     * Build the payload structure for message to the `kwil.call()` method (i.e. the call GRPC endpoint - see {@link https://github.com/kwilteam/proto/blob/main/kwil/tx/v1/call.proto})
     * 
     * @returns {Message} - A promise that resolves to the built message, with signature if provided.
     * @throws {Error} - If the required fields in the builder are null or undefined.
     */
    async buildMsg(): Promise<Message> {
        // complete lazy evaluation of payload
        const resolvedPayload = await this.resolvePayload();

        // create the msg object with the payload, with the payload bytes type set to uint8 for RLP encoding.
        let msg = Msg.create<BytesEncodingStatus.UINT8_ENCODED>(msg => {
            msg.body.payload = resolvedPayload as UnencodedActionPayload<PayloadType.CALL_ACTION>;
        });

        // if a signer has been provided, execute a signed `view` action
        if(this._signer) {
            // ensure required fields are provided in the builder
            const publicKey = objects.requireNonNil(this._publicKey, 'public key is required to build a message that uses a signer.')
            const signatureType = objects.requireNonNil(this._signatureType, 'signature type is required to build a signed message.')

            // ensure a valid signature type is used
            if(this._signatureType === SignatureType.SIGNATURE_TYPE_INVALID) {
                throw new Error("Signature type is invalid.");
            }

            // sign the message
            return await PayloadBuilderImpl.signMsg(msg, this._signer, publicKey, signatureType, this._description);
        }

        // return the unsigned message, with the payload base64 encoded
        return Msg.copy<BytesEncodingStatus.BASE64_ENCODED>(msg, msg => {
            // rlp encode the payload and convert to base64 for transport over GRPC
            msg.body.payload = bytesToBase64(kwilEncode(resolvedPayload));
        });
    }

    /**
     * Execute lazy evaluation of payload.
     * 
     * @returns {AllPayloads} - A promise that resolves to the provided payload object.
     */
    private async resolvePayload(): Promise<AllPayloads> {
        const payloadFn = objects.requireNonNil(this._payload, "payload is required to build the payload.");

        const resolvedPayload = objects.requireNonNil(payloadFn(), "payload cannot resolve to be null.");

        return resolvedPayload
    }

    /**
     * Signs the payload of a transaction / request to the broadcast GRPC endpoint.
     * 
     * @param {BaseTransaction} tx - The transaction to sign. See {@link BaseTransaction} for more information.
     * @param {SignerSupplier} signer - The signer to be used to sign the transaction.
     * @param {Uint8Array} pubKey - The public key for the signature, represented as bytes.
     * @param {AnySignatureType} signatureType - The signature type being used. See {@link SignatureType} for more information.
     * @param {string} description - The description to be included in the signature.
     * @returns {BaseTransaction} - A promise that resolves to the signed transaction.
     * @throws {Error} - If the the signer is not an Ethers Signer or a function that accepts and returns a Uint8Array.
     */
    private static async signTx(tx: BaseTransaction<BytesEncodingStatus.UINT8_ENCODED>, signer: SignerSupplier, pubKey: Uint8Array, signatureType: AnySignatureType, description: string): Promise<Transaction> {
        // create salt
        const salt = generateSalt(16);

        // create the digest, which is the first bytes of the sha256 hash of the rlp-encoded payload
        const digest = sha256BytesToBytes(tx.body.payload as Uint8Array).subarray(0, 20);

        // create the signature message
        const signatureMessage = `${description}

PayloadType: ${tx.body.payload_type}
PayloadDigest: ${bytesToHex(digest)}
Fee: ${tx.body.fee}
Nonce: ${tx.body.nonce}
Salt: ${bytesToHex(salt)}

Kwil 🖋
`

        // sign the above message
        const signedMessage = await executeSign(stringToBytes(signatureMessage), signer, signatureType);

        // copy the transaction and add the signature
        return Txn.copy<BytesEncodingStatus.BASE64_ENCODED>(tx, (newTx) => {
            newTx.signature = {
                // bytes must be base64 encoded for transport over GRPC
                signature_bytes: bytesToBase64(signedMessage),
                signature_type: signatureType.toString() as SignatureType
            };
            newTx.body = {
                description: description,
                payload: bytesToBase64(tx.body.payload as Uint8Array),
                payload_type: newTx.body.payload_type as PayloadType,
                fee: newTx.body.fee?.toString(),
                nonce: newTx.body.nonce,
                // bytes must be base64 encoded for transport over GRPC
                salt: bytesToBase64(salt),
            };
            // bytes must be base64 encoded for transport over GRPC
            newTx.sender = bytesToBase64(pubKey);
            newTx.serialization = SerializationType.SIGNED_MSG_CONCAT;
        });
    }

    /**
     * Signs the payload of a `view action` / call request to the call GRPC endpoint.
     * 
     * @param {Message} msg - The message to sign. See {@link Message} for more information. 
     * @param {SignerSupplier} signer - The signer to be used to sign the message.
     * @param {Uint8Array} pubKey - The public key for the signature, represented as bytes.
     * @param {AnySignatureType} signatureType - The signature type being used. See {@link SignatureType} for more information.
     * @param {string} description - The description to be included in the signature. 
     * @returns Message - A promise that resolves to the signed message.
     * @throws {Error} - If the the signer is not an Ethers Signer or a function that accepts and returns a Uint8Array.
     */
    private static async signMsg(msg: BaseMessage<BytesEncodingStatus.UINT8_ENCODED>, signer: SignerSupplier, pubKey: Uint8Array, signatureType: AnySignatureType, description: string): Promise<Message> {
        // ensure that the payload is not already base64 encoded
        if(typeof msg.body.payload === "string") {
            throw new Error("Payload must be an object to sign a message.");
        }

        // rlp encode the payload
        const encodedPayload = kwilEncode(msg.body.payload as UnencodedActionPayload<PayloadType.CALL_ACTION>);

        // create the digest, which is the first bytes of the sha256 hash of the rlp-encoded payload
        const digest = sha256BytesToBytes(encodedPayload).subarray(0, 20);

        // create the signature message
        const signatureMessage = `${description}

DBID: ${msg.body.payload?.dbid}
Action: ${msg.body.payload?.action}
PayloadDigest: ${bytesToHex(digest)}

Kwil 🖋
`
        // sign the above message
        const signedMessage = await executeSign(stringToBytes(signatureMessage), signer, signatureType);

        // copy the message and add the signature, with bytes set to base64 for transport over GRPC
        return Msg.copy<BytesEncodingStatus.BASE64_ENCODED>(msg, (msg) => {
            // bytes must be base64 encoded for transport over GRPC
            msg.body.payload = bytesToBase64(encodedPayload);
            msg.body.description = description;
            msg.signature = {
                // bytes must be base64 encoded for transport over GRPC
                signature_bytes: bytesToBase64(signedMessage),
                signature_type: signatureType.toString() as SignatureType
            };
            // bytes must be base64 encoded for transport over GRPC
            msg.sender = bytesToBase64(pubKey);
            msg.serialization = SerializationType.SIGNED_MSG_CONCAT;
        })
    }
}