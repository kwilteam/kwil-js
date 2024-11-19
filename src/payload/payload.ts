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
import { objects } from '../utils/objects';
import { kwilEncode } from '../utils/rlp';
import { bytesToHex, stringToBytes } from '../utils/serial';
import { strings } from '../utils/strings';
import { validateFields } from '../utils/validation';

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
  private description?: string;
  private nonce?: number;
  private challenge?: string;
  private signature?: Signature<BytesEncodingStatus.BASE64_ENCODED>;

  /**
   * Initializes a new `Payload` instance.
   *
   * @param {Kwil} kwil - The Kwil client, used to call higher-level methods on the Kwil class.
   */
  constructor(kwil: Kwil<T>, options: PayloadOptions) {
    this.kwil = objects.requireNonNil(
      kwil,
      'client is required for TxnBuilder. Please pass a valid Kwil client. This is an internal error, please create an issue.'
    );
    this.payloadType = options.payloadType;
    this.payload = options.payload;
    this.signer = options.signer;
    this.identifier = options.identifier;
    this.signatureType = options.signatureType;
    this.chainId = options.chainId;
    this.description = options.description;
    this.nonce = options.nonce;
    this.challenge = options.challenge;
    this.signature = options.signature;
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

    // ensure required fields are not null or undefined
    const { signer, payloadType, identifier, signatureType, chainId } = validateFields(
      {
        signer: this.signer,
        payloadType: this.payloadType,
        identifier: this.identifier,
        signatureType: this.signatureType,
        chainId: this.chainId,
      },
      (fieldName: string) => `${fieldName} is required to build a transaction.`
    );

    const preEstTxn = Txn.create<BytesEncodingStatus.BASE64_ENCODED>((tx) => {
      tx.body.payload = bytesToBase64(kwilEncode(resolvedPayload));
      tx.body.type = payloadType;
      tx.sender = bytesToHex(identifier);
    });

    // estimate the cost of the transaction with the estimateCost symbol from the client
    const cost = await unwrap(this.kwil)(preEstTxn);

    // retrieve the account for the nonce, if none is provided
    let nonce = this.nonce;

    if (!this.nonce) {
      const acct = await this.kwil.getAccount(identifier);
      nonce =
        Number(
          objects.requireNonNil(
            acct.data?.nonce,
            'something went wrong retrieving your account nonce.'
          )
        ) + 1;
    }

    const postEstTxn = Txn.copy<BytesEncodingStatus.UINT8_ENCODED>(preEstTxn, (tx) => {
      tx.body.payload = base64ToBytes(preEstTxn.body.payload as string);
      tx.body.fee = BigInt(
        strings.requireNonNil(
          cost.data,
          'something went wrong estimating the cost of your transaction.'
        )
      );
      tx.body.nonce = objects.requireNonNil(
        nonce,
        'something went wrong retrieving your account nonce.'
      );
      tx.body.chain_id = chainId;
    });

    // check that a valid signature is used
    if (this.signatureType === SignatureType.SIGNATURE_TYPE_INVALID) {
      throw new Error('Signature type is invalid.');
    }

    const signedTx = Payload.signTx(
      postEstTxn,
      signer,
      identifier,
      signatureType,
      this.description!
    );

    return signedTx;
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

    /**
     * create the signature message
     * the signature message cannot have any preceding or succeeding white space. Must be exact length as server expects it
     */
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

// TODO ==> create a helper function that checks for types vs having all of these if statements (ugly)
// TODO ==> consider extracting the various functions into separate classes to make classes cleaner and easier to follow...