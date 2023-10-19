import { strings } from "../utils/strings";
import { Base64String, Nillable, NonNil } from "../utils/types";
import { BytesEncodingStatus, PayloadBytesTypes, PayloadType, SerializationType } from "./enums";
import { UnencodedActionPayload } from "./payload";
import { Signature } from "./signature";

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
    signature: Nillable<Signature<T>>;
    sender: Nillable<T extends BytesEncodingStatus.BASE64_ENCODED ? Base64String : Uint8Array>;
    serialization: SerializationType;
}

interface MsgBody<T extends PayloadBytesTypes> {
    payload: Nillable<T extends BytesEncodingStatus.BASE64_ENCODED ? Base64String : UnencodedActionPayload<PayloadType.CALL_ACTION>>;
    description: string;
}

/**
 * `Message` is the payload structure for a request to the Kwil `call` GRPC endpoint {@link https://github.com/kwilteam/proto/blob/main/kwil/tx/v1/call.proto}.
 * 
 * All bytes in the payload are base64 encoded.
 */
export type Message = BaseMessage<BytesEncodingStatus.BASE64_ENCODED>

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
                description: ""
            },
            signature: null,
            sender: null,
            serialization: SerializationType.SIGNED_MSG_CONCAT
        };
    }

    public isSigned(): boolean {
        return !strings.isNilOrEmpty(this.signature?.signature_bytes as string);
    }

    public get body(): Readonly<MsgBody<T>> {
        return this.data.body;
    }

    public get signature(): Readonly<Signature<T> | null> {
        if(!this.data.signature) {
            return null
        }

        return this.data.signature;
    }

    public get sender(): Nillable<T extends BytesEncodingStatus.BASE64_ENCODED ? Base64String : Uint8Array> {
        return this.data.sender;
    }

    public get serialization(): SerializationType {
        return this.data.serialization;
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
    export function create<T extends PayloadBytesTypes>(configure: (msg: MsgData<T>) => void): NonNil<BaseMessage<T>> {
        // create a basic template of msg. Null values are used to be compatible with both types in PayloadBytesTypes.
        const msg = {
            body: {
                payload: null,
                description: ""
            },
            signature: null,
            sender: null,
            serialization: SerializationType.SIGNED_MSG_CONCAT
        }

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
    export function copy<T extends PayloadBytesTypes>(source: NonNil<BaseMessage<PayloadBytesTypes>>, configure: (msg: MsgData<T>) => void): NonNil<BaseMessage<T>> {
        return Msg.create((msg: MsgData<PayloadBytesTypes>) => {
            // copy all fields from source to msg
            msg.body = source.body;
            msg.signature = source.signature;
            msg.sender = source.sender;
            msg.serialization = source.serialization;

            // Pass the 'msg' object to the 'configure' function allowing external modification of its propoerties before instantiation of BaseMessage.
            configure(msg);
        })
    }
}