import { Nillable, NonNil } from "../utils/types";
import { Signature, SignatureType } from "./signature";
import { strings } from "../utils/strings";
import { PayloadType } from "./enums";

export interface TxReceipt {
    get txHash(): string;
    get fee(): string;
    get body(): Nillable<string>;
}

export interface TxnData {
    signature: Signature;
    sender: string;
    body: TxBody;
}

interface TxBody {
    payload: string;
    payload_type: PayloadType;
    fee: string;
    nonce: number | null;
    salt: string;
}

export interface DropDbPayload {
    owner: string;
    name: string;
}

export class Transaction implements TxnData {
    private readonly data: Readonly<TxnData>;

    constructor(data?: NonNil<TxnData>) {
        this.data = data || {
            signature: {
                signature_bytes: "",
                signature_type: SignatureType.SECP256K1_PERSONAL
            },
            sender: "",
            body: {
                payload: "",
                payload_type: PayloadType.EXECUTE_ACTION,
                fee: "0",
                nonce: null,
                salt: "",
            },
        };
    }

    public isSigned(): boolean {
        return !strings.isNilOrEmpty(this.data.signature.signature_bytes);
    }

    public get signature(): Readonly<Signature> {
        return this.data.signature;
    }

    public get sender(): string {
        return this.data.sender;
    }

    public get body(): Readonly<TxBody> {
        return this.data.body;
    }

    // noinspection JSUnusedLocalSymbols
    private toJSON(): Readonly<TxnData> {
        return this.data;
    }
}

export namespace Txn {
    export function create(configure: (tx: TxnData) => void): NonNil<Transaction> {
        const tx = {
            signature: {
                signature_bytes: "",
                signature_type: SignatureType.SECP256K1_PERSONAL
            },
            sender: "",
            body: {
                payload: "",
                payload_type: PayloadType.EXECUTE_ACTION,
                fee: "0",
                nonce: null,
                salt: "",
            },
        };

        configure(tx);

        return new Transaction(tx);
    }

    export function copy(source: NonNil<Transaction>, configure: (tx: TxnData) => void): NonNil<Transaction> {
        return Txn.create((tx) => {
            tx.sender = source.sender;
            tx.signature = source.signature;
            tx.body = source.body;
            configure(tx);
        });
    }
}
