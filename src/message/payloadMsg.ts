import { SignerSupplier } from '../core/signature';
import { BytesEncodingStatus, PayloadType } from '../core/enums';
import { BaseMessage, Message, Msg } from '../core/message';
import { AllPayloads, UnencodedActionPayload } from '../core/payload';
import { AnySignatureType, Signature, SignatureType } from '../core/signature';
import { bytesToBase64 } from '../utils/base64';
import { objects } from '../utils/objects';
import { kwilEncode } from '../utils/rlp';
import { bytesToHex } from '../utils/serial';

export interface PayloadMsgOptions {
  challenge: string;
  signatureType: AnySignatureType;
  identifier: Uint8Array;
  signer: SignerSupplier;
  signature: Signature<BytesEncodingStatus.BASE64_ENCODED>;
}

/**
 * `PayloadMsg` class creates a call message payload that can be sent over GRPC.
 */
export class PayloadMsg {
  public payload: UnencodedActionPayload<PayloadType.CALL_ACTION>;
  public challenge: string;
  public signatureType: AnySignatureType;
  public identifier: Uint8Array;
  public signer: SignerSupplier;
  public signature: Signature<BytesEncodingStatus.BASE64_ENCODED>;

  /**
   * Initializes a new `PayloadMsg` instance.
   *
   * @param {PayloadMsgOptions} options - Parameters interface to build a payload message.
   */
  constructor(payload: UnencodedActionPayload<PayloadType.CALL_ACTION>, options: Partial<PayloadMsgOptions>) {
    this.payload = objects.requireNonNil(
      payload,
      'Payload is required for Payload Msg Builder. Please pass a valid payload.'
    );

    // Validate optional parameters if passed into Payload Txn Builder
    objects.validateOptionalFields(options, [
      'signature',
      'challenge',
      'signer',
      'identifier',
      'signatureType',
    ]);

    this.signature = options.signature!;
    this.challenge = options.challenge!;
    this.signer = options.signer!;
    this.identifier = options.identifier!;
    this.signatureType = options.signatureType!;
  }

  /**
   * Static factory method to create a new Payload instance.
   *
   * @param kwil - The Kwil client.
   * @param options - The options to configure the Payload instance.
   */
  static createMsg(payload: UnencodedActionPayload<PayloadType.CALL_ACTION>, options: Partial<PayloadMsgOptions>): PayloadMsg {
    return new PayloadMsg(payload, options);
  }

  /**
   * Build the payload structure for a message.
   */
  async buildMsg(): Promise<Message> {
    let msg = Msg.create<BytesEncodingStatus.UINT8_ENCODED>((msg) => {
      msg.body.payload = this.payload;
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
        return await PayloadMsg.authMsg(msg, identifier, signatureType!);
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
    const unencodedPayload = objects.requireNonNil(
      msg.body.payload,
      'Payload is required to sign a message. This is likely an internal error. Please create an issue.'
    )

    // rlp encode the payload
    const encodedPayload = kwilEncode(
      unencodedPayload
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
