import { Nillable, NonNil } from "../utils/types";
import { ValueType } from "./enums";
import { Signature, SignatureType } from "./signature";

export type UnencodedMessagePayload = {
    dbid: string;
    action: string;
    arguments: ValueType[];
}

export interface MsgData {
    signature: Signature | null;
    payload: string | Uint8Array;
    sender: string;
}

export interface MsgReceipt {
    get result(): Nillable<string>;
}

export class Message implements MsgData {
    private data: Readonly<MsgData>;

    constructor(data?: NonNil<MsgData>) {
        this.data = data || {
            signature: null,
            payload: "",
            sender: ""
        };
    }

    
    public get payload(): Readonly<string | Uint8Array> {
        return this.data.payload;
    }

    public get signature(): Readonly<Signature | null> {
        if(!this.data.signature) {
            return null
        }

        return this.data.signature;
    }

    public get sender(): string {
        return this.data.sender;
    }
}

export namespace Msg {
    export function create(configure: (msg: MsgData) => void): NonNil<Message> {
        const msg = {
            signature: null,
            payload: "",
            sender: ""
        }

        configure(msg);

        return new Message(msg);
    }

    export function copy(source: NonNil<Message>, configure: (msg: MsgData) => void): NonNil<Message> {
        return Msg.create((msg: MsgData) => {
            msg.payload = source.payload;
            msg.sender = source.sender;
            msg.signature = source.signature;

            configure(msg);
        })
    }
}