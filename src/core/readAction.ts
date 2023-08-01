import { NonNil } from "../utils/types";
import { Signature, SignatureType } from "./signature";

export type ReadActionPayload = {
    dbid: string;
    name: string;
    params?: Map<string, string>;
}

export type ReadActionReq = {
    payload: ReadActionPayload;
    signature?: Signature;
    sender: string;
}

export class ReadActionBody implements ReadActionReq {
    private data: Readonly<ReadActionReq>;

    constructor(data?: NonNil<ReadActionReq>) {
        this.data = data || {
            payload: {
                dbid: "",
                name: "",
                params: new Map<string, string>(),
            },
            sender: "",
        };
    }

    
    public get payload(): ReadActionPayload {
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