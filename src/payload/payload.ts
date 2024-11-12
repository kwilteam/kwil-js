import { unwrap } from '../client/intern';
import { Kwil } from '../client/kwil';
import { SignerSupplier } from '../core/builders';
import {
  BytesEncodingStatus,
  EnvironmentType,
  PayloadType,
  SerializationType,
} from '../core/enums';
import { BaseMessage, Message, Msg } from '../core/message';
import { AllPayloads, UnencodedActionPayload } from '../core/payload';
import { AnySignatureType, executeSign, Signature, SignatureType } from '../core/signature';
import { BaseTransaction, Transaction, Txn } from '../core/tx';
import { base64ToBytes, bytesToBase64 } from '../utils/base64';
import { sha256BytesToBytes } from '../utils/crypto';
import { kwilEncode } from '../utils/rlp';
import { bytesToHex, stringToBytes } from '../utils/serial';

export interface PayloadOptions {
  payloadType?: PayloadType;
  payload?: (() => AllPayloads) | AllPayloads;
  signer?: SignerSupplier;
  identifier?: Uint8Array;
  signatureType?: AnySignatureType;
  chainId?: string;
  description?: string;
  nonce?: number;
  challenge?: string;
  signature?: Signature<BytesEncodingStatus.BASE64_ENCODED>;
}

export class Payload<T extends EnvironmentType> {
  private kwil: Kwil<T>;
  private payloadType?: PayloadType;
  private payload?: (() => AllPayloads) | AllPayloads;
  private signer?: SignerSupplier;
  private identifier?: Uint8Array;
  private signatureType?: AnySignatureType;
  private chainId?: string;
  private description?: string = '';
  private nonce?: number;
  private challenge?: string = '';
  private signature?: Signature<BytesEncodingStatus.BASE64_ENCODED>;

  /**
   * Initializes a new `PayloadBuilderImpl` instance.
   *
   * @param {Kwil} kwil - The Kwil client, used to call higher-level methods on the Kwil class.
   */
  constructor(kwil: Kwil<T>, options: PayloadOptions) {
    this.kwil = kwil;
    this.chainId = options.chainId;
    this.description = options.description;
    this.payload = options.payload;
    this.identifier = options.identifier;
    this.signer = options.signer;
    this.signatureType = options.signatureType;
  }

  /**
   * Static factory method to create a new Payload instance.
   *
   * @param kwil - The Kwil client.
   * @param options - The options to configure the Payload instance.
   */
  static create<T extends EnvironmentType>(kwil: Kwil<T>, options: PayloadOptions): Payload<T> {
    return new Payload<T>(kwil, options);
  }

  /**
   * Build the payload structure for a transaction.
   */
  async buildTx(): Promise<Transaction> {
    const resolvedPayload = await this.resolvePayload();

    const preEstTxn = Txn.create<BytesEncodingStatus.BASE64_ENCODED>((tx) => {
      tx.body.payload = bytesToBase64(kwilEncode(resolvedPayload));
      tx.body.type = this.payloadType!;
      tx.sender = bytesToHex(this.identifier!);
    });

    const cost = await unwrap(this.kwil)(preEstTxn);
    const nonce =
      this.nonce ?? ((await this.kwil.getAccount(this.identifier!)).data?.nonce || 0) + 1;

    const postEstTxn = Txn.copy<BytesEncodingStatus.UINT8_ENCODED>(preEstTxn, (tx) => {
      tx.body.payload = base64ToBytes(preEstTxn.body.payload as string);
      tx.body.fee = BigInt(cost.data!);
      tx.body.nonce = nonce!;
      tx.body.chain_id = this.chainId!;
    });

    return Payload.signTx(
      postEstTxn,
      this.signer!,
      this.identifier!,
      this.signatureType!,
      this.description!
    );
  }

  /**
   * Signs the payload of a transaction / request to the broadcast GRPC endpoint.
   *
   * @param {BaseTransaction} tx - The transaction to sign. See {@link BaseTransaction} for more information.
   * @param {SignerSupplier} signer - The signer to be used to sign the transaction.
   * @param {Uint8Array} identifier - The identifier (e.g. wallet address, public key, etc) for the signature, represented as bytes.
   * @param {AnySignatureType} signatureType - The signature type being used. See {@link SignatureType} for more information.
   * @param {string} description - The description to be included in the signature.
   * @returns {BaseTransaction} - A promise that resolves to the signed transaction.
   * @throws {Error} - If the the signer is not an Ethers Signer or a function that accepts and returns a Uint8Array.
   */
  private static async signTx(
    tx: BaseTransaction<BytesEncodingStatus.UINT8_ENCODED>,
    signer: SignerSupplier,
    identifier: Uint8Array,
    signatureType: AnySignatureType,
    description: string
  ): Promise<Transaction> {
    // create the digest, which is the first bytes of the sha256 hash of the rlp-encoded payload
    const digest = sha256BytesToBytes(tx.body.payload as Uint8Array).subarray(0, 20);

    // create the signature message
    const signatureMessage = `${description}
  
  PayloadType: ${tx.body.type}
  PayloadDigest: ${bytesToHex(digest)}
  Fee: ${tx.body.fee}
  Nonce: ${tx.body.nonce}
  
  Kwil Chain ID: ${tx.body.chain_id}
  `;

    // sign the above message
    const signedMessage = await executeSign(stringToBytes(signatureMessage), signer, signatureType);

    // copy the transaction and add the signature
    return Txn.copy<BytesEncodingStatus.BASE64_ENCODED>(tx, (newTx) => {
      newTx.signature = {
        // bytes must be base64 encoded for transport over GRPC
        sig: bytesToBase64(signedMessage),
        type: signatureType.toString() as SignatureType,
      };
      newTx.body = {
        desc: description,
        payload: bytesToBase64(tx.body.payload as Uint8Array),
        type: newTx.body.type as PayloadType,
        fee: newTx.body.fee?.toString() || '',
        nonce: newTx.body.nonce,
        chain_id: newTx.body.chain_id,
      };
      // bytes must be base64 encoded for transport over GRPC
      newTx.sender = bytesToHex(identifier);
      newTx.serialization = SerializationType.SIGNED_MSG_CONCAT;
    });
  }

  /**
   * Build the payload structure for a message.
   */
  async buildMsg(): Promise<Message> {
    const resolvedPayload = await this.resolvePayload();

    let msg = Msg.create<BytesEncodingStatus.UINT8_ENCODED>((msg) => {
      msg.body.payload = resolvedPayload as UnencodedActionPayload<PayloadType.CALL_ACTION>;
      msg.body.challenge = this.challenge;
      msg.signature = this.signature;
    });

    if (this.identifier) {
      return await Payload.authMsg(msg, this.identifier, this.signatureType!);
    }

    // return the unsigned message, with the payload base64 encoded
    return Msg.copy<BytesEncodingStatus.BASE64_ENCODED>(msg, (msg) => {
      // rlp encode the payload and convert to base64 for transport over GRPC
      msg.body.payload = bytesToBase64(kwilEncode(resolvedPayload));
    });
  }

  /**
   * Adds the caller's sender address to the message.
   *
   * @param {Message} msg - The message to sign. See {@link Message} for more information.
   * @param {Uint8Array} identifier - The identifier (e.g. wallet address, public key, etc) for the signature, represented as bytes.
   * @param {AnySignatureType} signatureType - The signature type being used. See {@link SignatureType} for more information.
   * @param {string} description - The description to be included in the signature.
   * @returns Message - A promise that resolves to the signed message.
   * @throws {Error} - If the the signer is not an Ethers Signer or a function that accepts and returns a Uint8Array.
   */
  private static async authMsg(
    msg: BaseMessage<BytesEncodingStatus.UINT8_ENCODED>,
    identifier: Uint8Array,
    signatureType: AnySignatureType
  ): Promise<Message> {
    // rlp encode the payload
    const encodedPayload = kwilEncode(
      msg.body.payload as UnencodedActionPayload<PayloadType.CALL_ACTION>
    );

    // copy the message and add the signature, with bytes set to base64 for transport over GRPC
    return Msg.copy<BytesEncodingStatus.BASE64_ENCODED>(msg, (msg) => {
      // bytes must be base64 encoded for transport over GRPC
      msg.body.payload = bytesToBase64(encodedPayload);
      msg.auth_type = signatureType;
      // bytes must be base64 encoded for transport over GRPC
      msg.sender = bytesToHex(identifier);
    });
  }

  /**
   * Method to resolve the payload from either direct value or a function.
   */
  private async resolvePayload(): Promise<AllPayloads> {
    if (typeof this.payload === 'function') {
      const resolvedPayload = this.payload();

      if (resolvedPayload === undefined) {
        throw new Error('Payload function returned undefined.');
      }

      // Cast resolvedPayload as AllPayloads, as we've checked it can't be undefined.
      return resolvedPayload as AllPayloads;
    }
    throw new Error('Payload is missing.');
  }
}

// TODO => refactor all of the build functions
// buildTx() => builds the payload for kwil.broadcast() method (GRPC broadcast endpoint) - resolves to the signed transaction
// buildMsg() => builds the payload structure for message to the kwil.call() method - resolves to the message with signature if provided
// resolvePayload() => resolves the provided payload object
// signTx() => signs the payload of a transaction to the GRPC broadcast endpoint
// authMsg() => adds caller's sender address to the message - resolves to the signed message

// TODO => create a function that streamlines the repetitiveness in lines 155-175
// somehow maybe map through all of the txPayload properties you want to provide and then...
// ...dynamically create txPayload.param = objects.requireNonNil(param, `${param} is required`)

// TODO => Think about this...
// see if you even need to preassign variables like above (txPayload). May be able to directly call buildTx to build it vs all of the chaining non-sense
// may not even need the top part. may just need to call the functions without them
