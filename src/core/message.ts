import { Nillable, NonNil } from "../utils/types";
import { PayloadType, SerializationType } from "./enums";
import { UnencodedActionPayload } from "./payload";
import { Signature } from "./signature";

export interface MsgData {
    body: MsgBody;
    signature: Signature | null;
    sender: string;
    serialization: SerializationType;
}

interface MsgBody {
    payload: string | UnencodedActionPayload<PayloadType.CALL_ACTION>;
    description: string;
}


export interface MsgReceipt {
    get result(): Nillable<string>;
}

export class Message implements MsgData {
    private data: Readonly<MsgData>;

    constructor(data?: NonNil<MsgData>) {
        this.data = data || {
            body: {
                payload: "",
                description: ""
            },
            signature: null,
            sender: "",
            serialization: SerializationType.SIGNED_MSG_CONCAT
        };
    }

    
    public get body(): Readonly<MsgBody> {
        return this.data.body;
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

    public get serialization(): SerializationType {
        return this.data.serialization;
    }
}

export namespace Msg {
    export function create(configure: (msg: MsgData) => void): NonNil<Message> {
        const msg = {
            body: {
                payload: "",
                description: ""
            },
            signature: null,
            sender: "",
            serialization: SerializationType.SIGNED_MSG_CONCAT
        }

        configure(msg);

        return new Message(msg);
    }

    export function copy(source: NonNil<Message>, configure: (msg: MsgData) => void): NonNil<Message> {
        return Msg.create((msg: MsgData) => {
            msg.body = source.body;
            msg.signature = source.signature;
            msg.sender = source.sender;
            msg.serialization = source.serialization;

            configure(msg);
        })
    }
}