import { NonNil } from "../utils/types";
import { Signature, SignatureType } from "./signature";
import { strings } from "../utils/strings";
import { PayloadType } from "./enums";

export interface TxReceipt {
    get txHash(): string;
}

export interface TxnData {
    signature: Signature;
    body: TxBody;
    sender: string;
}

interface TxBody {
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
            },
            sender: "",
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
            body: {
                payload: "",
                payload_type: PayloadType.EXECUTE_ACTION,
                fee: BigInt("0"),
                nonce: null,
                salt: '',
            },
            signature: {
                signature_bytes: "",
                signature_type: SignatureType.SECP256K1_PERSONAL
            },
            sender: "",
        };

        configure(tx);

        return new Transaction(tx);
    }

    export function copy(source: NonNil<Transaction>, configure: (tx: TxnData) => void): NonNil<Transaction> {
        return Txn.create((tx: TxnData) => {
            tx.body = source.body;
            tx.signature = source.signature;
            tx.body = source.body;
            configure(tx);
        });
    }
}
