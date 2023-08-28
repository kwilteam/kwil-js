import { Nillable, NonNil } from "../utils/types";
import { ActionInput } from "./actionInput";
import { Signature, SignatureType } from "./signature";

export type UnencodedMessagePayload = {
    dbid: string;
    action: string;
    params?: ActionInput |{};
}

export type MessageReq = {
    payload: string;
    signature: Signature;
    sender: string;
}

export interface MsgReceipt {
    get result(): Nillable<string>;
}

export class Message implements MessageReq {
    private data: Readonly<MessageReq>;

    constructor(data?: NonNil<MessageReq>) {
        this.data = data || {
            payload: "",
            sender: "",
            signature: {
                signature_bytes: "",
                signature_type: SignatureType.SIGNATURE_TYPE_INVALID
            }
        };
    }

    
    public get payload(): Readonly<string> {
        return this.data.payload;
    }

    public get signature(): Readonly<Signature> {
        if(!this.data.signature) {
            throw new Error("Signature is not set");
        }

        return this.data.signature;
    }

    public get sender(): string {
        return this.data.sender;
    }
}

export namespace Msg {
    export function create(configure: (msg: MessageReq) => void): NonNil<Message> {
        const msg = {
            payload: "",
            sender: "",
            signature: {
                signature_bytes: "",
                signature_type: SignatureType.SIGNATURE_TYPE_INVALID
            }
        }

        configure(msg);

        return new Message(msg);
    }

    export function copy(source: NonNil<Message>, configure: (msg: MessageReq) => void): NonNil<Message> {
        const clonedMsg: MessageReq = {
            payload: source.payload,
            sender: source.sender,
           
            signature: source['data'].signature
        };

        configure(clonedMsg);

        return new Message(clonedMsg);
    }
}