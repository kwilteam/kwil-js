import { Base64String, HexString, Nillable, NonNil } from '../utils/types';
import { BytesEncodingStatus, PayloadBytesTypes, PayloadType } from './enums';
import { UnencodedActionPayload } from './payload';
import { AnySignatureType, Signature, SignatureType } from './signature';

/**
 * `MsgReceipt` is the interface for a payload structure for a response from the Kwil `call` GRPC endpoint {@link https://github.com/kwilteam/proto/blob/main/kwil/tx/v1/call.proto}.
 */
export interface MsgReceipt {
  get result(): Nillable<Base64String>;
}

/**
 * `MsgData` is the interface for a payload structure for a request to the Kwil `call` GRPC endpoint {@link https://github.com/kwilteam/proto/blob/main/kwil/tx/v1/call.proto}.
 */
export interface MsgData<T extends PayloadBytesTypes> {
  body: MsgBody<T>;
  auth_type: AnySignatureType;
  // when the other bytes are base64, it means it is time to turn the sender bytes to hex string
  sender: Nillable<T extends BytesEncodingStatus.BASE64_ENCODED ? HexString : Uint8Array>;
  signature: Nillable<Signature<BytesEncodingStatus.BASE64_ENCODED>>;
}

interface MsgBody<T extends PayloadBytesTypes> {
  payload: Nillable<
    T extends BytesEncodingStatus.BASE64_ENCODED
      ? Base64String
      : UnencodedActionPayload<PayloadType.CALL_ACTION>
  >;
  challenge?: Nillable<HexString>;
}

/**
 * `Message` is the payload structure for a request to the Kwil `call` GRPC endpoint {@link https://github.com/kwilteam/proto/blob/main/kwil/tx/v1/call.proto}.
 *
 * All bytes in the payload are base64 encoded.
 */
export type Message = BaseMessage<BytesEncodingStatus.BASE64_ENCODED>;

export interface CallClientResponse<T> {
  status: number;
  data?: T;
  authCode?: number;
}

/**
 * `BaseMessage` is the bass class for the payload structure for a request to the Kwil `call` GRPC endpoint {@link https://github.com/kwilteam/proto/blob/main/kwil/tx/v1/call.proto}.
 *
 * Bytes in the message can be typed to be either base64 encoded or Uint8Array. Uint8Array should be used when building the message within the SDK, and base64 should be used for the final message to be send over GRPC.
 *
 * @template {BytesEncodingStatus.BASE64_ENCODED | BytesEncodingStatus.UINT8_ENCODED} T - The type of bytes in the message. Can be either base64 encoded or Uint8Array.
 * @implements {MsgData<T>} - The message data interface.
 */
export class BaseMessage<T extends PayloadBytesTypes> implements MsgData<T> {
  private data: Readonly<MsgData<T>>;

  constructor(data?: NonNil<MsgData<T>>) {
    // create a basic template of msg. Null values are used to be compatible with both types in PayloadBytesTypes.
    this.data = data || {
      body: {
        payload: null,
        challenge: '',
      },
      auth_type: SignatureType.SECP256K1_PERSONAL,
      sender: null,
      signature: {
        sig: '',
        type: SignatureType.SECP256K1_PERSONAL,
      },
    };
  }

  public get body(): Readonly<MsgBody<T>> {
    return this.data.body;
  }

  public get auth_type(): AnySignatureType {
    return this.data.auth_type;
  }

  public get sender(): Nillable<
    T extends BytesEncodingStatus.BASE64_ENCODED ? Base64String : Uint8Array
  > {
    return this.data.sender;
  }

  public get signature(): Nillable<Signature<BytesEncodingStatus.BASE64_ENCODED>> {
    return this.data.signature;
  }
}

export namespace Msg {
  /**
   * Creates a new instance of the `BaseMessage` class.
   *
   * Bytes in the message can be typed to be either base64 encoded or Uint8Array. Uint8Array should be used when building the message within the SDK, and base64 should be used for the final message to be send over GRPC.
   *
   * @template {BytesEncodingStatus.BASE64_ENCODED | BytesEncodingStatus.UINT8_ENCODED} T - The type of bytes in the message. Can be either base64 encoded or Uint8Array.
   * @param {(msg: MsgData<T>) => void} configure - A callback function that takes in a `MsgData` object and sets fields on it.
   * @returns {BaseMessage<T>} - A new instance of the `BaseMessage` class.
   */
  export function create<T extends PayloadBytesTypes>(
    configure: (msg: MsgData<T>) => void
  ): NonNil<BaseMessage<T>> {
    // create a basic template of msg. Null values are used to be compatible with both types in PayloadBytesTypes.
    const msg = {
      body: {
        payload: null,
        challenge: '',
      },
      auth_type: SignatureType.SECP256K1_PERSONAL,
      sender: null,
      signature: {
        sig: '',
        type: SignatureType.SECP256K1_PERSONAL,
      },
    };

    // Pass the 'msg' object to the 'configure' function allowing external modification of its propoerties before instantiation of BaseMessage.
    configure(msg);

    return new BaseMessage(msg);
  }

  /**
   * Copies an existing instance of the `BaseMessage` class and modifies certain fields.
   *
   * Bytes in the message can be typed to be either base64 encoded or Uint8Array. Uint8Array should be used when building the message within the SDK, and base64 should be used for the final message to be send over GRPC.
   *
   * @template {BytesEncodingStatus.BASE64_ENCODED | BytesEncodingStatus.UINT8_ENCODED} T - The type of bytes in the message. Can be either base64 encoded or Uint8Array.
   * @param {BaseMessage<PayloadBytesTypes>} source - The source message to copy from. It can be using either base64 or Uint8Array bytes.
   * @param {(msg: MsgData<T>) => void} configure - A callback function that takes in a `MsgData` object and sets fields on it.
   * @returns {BaseMessage<T>} - A new instance of the `BaseMessage` class.
   */
  export function copy<T extends PayloadBytesTypes>(
    source: NonNil<BaseMessage<PayloadBytesTypes>>,
    configure: (msg: MsgData<T>) => void
  ): NonNil<BaseMessage<T>> {
    return Msg.create((msg: MsgData<PayloadBytesTypes>) => {
      // copy all fields from source to msg
      msg.body = source.body;
      msg.auth_type = source.auth_type;
      msg.sender = source.sender;
      msg.signature = source.signature;

      // Pass the 'msg' object to the 'configure' function allowing external modification of its propoerties before instantiation of BaseMessage.
      configure(msg);
    });
  }
}
