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

export interface PayloadOptions {
  payload: AllPayloads;
  payloadType?: PayloadType;
  signer?: SignerSupplier;
  identifier?: Uint8Array;
  signatureType?: AnySignatureType;
  chainId?: string;
  description?: string;
  nonce?: number;
  challenge?: string;
  signature?: Signature<BytesEncodingStatus.BASE64_ENCODED>;
}

/**
 * `Payload` class creates a transaction and call payloads that can be sent over GRPC.
 */
export class Payload<T extends EnvironmentType> {
  public kwil: Kwil<T>;
  public payload: AllPayloads;
  public payloadType?: PayloadType;
  public signer?: SignerSupplier;
  public identifier?: Uint8Array;
  public signatureType?: AnySignatureType;
  public chainId?: string;
  public description?: string;
  public nonce?: number;
  public challenge?: string;
  public signature?: Signature<BytesEncodingStatus.BASE64_ENCODED>;

  /**
   * Initializes a new `Payload` instance.
   *
   * @param {Kwil} kwil - The Kwil client, used to call higher-level methods on the Kwil class.
   */
  constructor(kwil: Kwil<T>, options: PayloadOptions) {
    this.kwil = objects.requireNonNil(
      kwil,
      'Client is required for TxnBuilder. Please pass a valid Kwil client. This is an internal error, please create an issue.'
    );
    this.payload = objects.requireNonNil(
      options.payload,
      'Payload is required for TxnBuilder. Please pass a valid payload.'
    );

    // Validate optional parameters if passed into Payload Txn Builder
    objects.validateOptionalFields(options, [
      'payloadType',
      'signer',
      'identifier',
      'signatureType',
      'chainId',
      'description',
      'nonce',
    ]);

    this.payloadType = options.payloadType;
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
  static createTx<T extends EnvironmentType>(kwil: Kwil<T>, options: PayloadOptions): Payload<T> {
    return new Payload<T>(kwil, options);
  }

  /**
   * Build the payload structure for a transaction.
   */
  async buildTx(): Promise<Transaction> {
    // ensure required fields are not null or undefined
    const { signer, payloadType, identifier, signatureType, chainId } = objects.validateFields(
      {
        signer: this.signer,
        payloadType: this.payloadType,
        identifier: this.identifier,
        signatureType: this.signatureType,
        chainId: this.chainId,
      },
      (fieldName: string) => `${fieldName} is required to build a transaction.`
    );

    // create transaction payload for estimating cost. Set the Tx bytes type to base64 encoded because we need to make GRPC estimate cost request.
    const preEstTxn = Txn.create<BytesEncodingStatus.BASE64_ENCODED>((tx) => {
      // rlp encode the payload and convert to base64
      tx.body.payload = bytesToBase64(kwilEncode(this.payload));
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

    // add the nonce and fee to the transaction. Set the tx bytes back to uint8 so we can do the signature.
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

    // sign the transaction
    return Payload.signTx(postEstTxn, signer, identifier, signatureType, this.description!);
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
    let msg = Msg.create<BytesEncodingStatus.UINT8_ENCODED>((msg) => {
      msg.body.payload = this.payload as UnencodedActionPayload<PayloadType.CALL_ACTION>;
      msg.body.challenge = this.challenge;
      msg.signature = this.signature;
    });

    if (this.signer) {
      // ensure required fields are not null or undefined
      const { identifier, signatureType } = objects.validateFields(
        {
          identifier: this.identifier,
          signatureType: this.signatureType,
        },
        (fieldName: string) => `${fieldName} required to build a message.`
      );
      if (identifier) {
        return await Payload.authMsg(msg, identifier, signatureType!);
      }
    }

    // return the unsigned message, with the payload base64 encoded
    return Msg.copy<BytesEncodingStatus.BASE64_ENCODED>(msg, (msg) => {
      // rlp encode the payload and convert to base64 for transport over GRPC
      msg.body.payload = bytesToBase64(kwilEncode(this.payload));
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
}
