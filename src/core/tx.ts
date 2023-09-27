import { NonNil } from "../utils/types";
import { Signature, SignatureType } from "./signature";
import { strings } from "../utils/strings";
import { PayloadType, SerializationType } from "./enums";

export interface TxReceipt {
    get tx_hash(): string;
}

export interface TxnData {
    signature: Signature;
    body: TxBody;
    sender: string | Uint8Array;
    serialization: SerializationType;
}

interface TxBody {
    description: string;
    payload: string | Uint8Array;
    payload_type: PayloadType;
    fee: BigInt | string;
    nonce: number | null;
    salt: Uint8Array | string;
}

export interface DropDbPayload {
    dbid: string
}

export class Transaction implements TxnData {
    private readonly data: Readonly<TxnData>;

    constructor(data?: NonNil<TxnData>) {
        this.data = data || {
            signature: {
                signature_bytes: "",
                signature_type: SignatureType.SECP256K1_PERSONAL
            },
            body: {
                payload: "",
                payload_type: PayloadType.EXECUTE_ACTION,
                fee: BigInt("0"),
                nonce: null,
                salt: '',
                description: ''
            },
            sender: "",
            serialization: SerializationType.SIGNED_MSG_CONCAT
        };
    }

    public isSigned(): boolean {
        return !strings.isNilOrEmpty(this.data.signature.signature_bytes as string);
    }

    public get signature(): Readonly<Signature> {
        return this.data.signature;
    }

    public get sender(): string | Uint8Array{
        return this.data.sender;
    }

    public get body(): Readonly<TxBody> {
        return this.data.body;
    }

    public get serialization(): SerializationType {
        return this.data.serialization;
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
            body: {
                description: '',
                payload: "",
                payload_type: PayloadType.EXECUTE_ACTION,
                fee: BigInt("0"),
                nonce: null,
                salt: '',
                
            },
            sender: "",
            serialization: SerializationType.SIGNED_MSG_CONCAT
        };

        configure(tx);

        return new Transaction(tx);
    }

    export function copy(source: NonNil<Transaction>, configure: (tx: TxnData) => void): NonNil<Transaction> {
        return Txn.create((tx: TxnData) => {
            tx.body = source.body;
            tx.signature = source.signature;
            tx.body = source.body;
            tx.sender = source.sender;
            tx.serialization = source.serialization;
            
            configure(tx);
        });
    }
}
