import { HexString, Nillable, NonNil } from "../utils/types";
import { Signature, SignatureType } from "./signature";
import { strings } from "../utils/strings";
import { PayloadType } from "./enums";

export interface TxReceipt {
    get txHash(): string;
    get fee(): string;
    get body(): Nillable<string>;
}

export interface TxnData<T> {
    signature: Signature;
    body: T;
    sender: string;
}

export interface TxBody {
    payload: string;
    payload_type: PayloadType;
    fee: string;
    nonce: number | null;
    salt: string;
}

export interface HexlifiedTxBody {
    payload: HexString;
    payload_type: HexString;
    fee: HexString;
    nonce: HexString;
    salt: HexString;
}

export interface DropDbPayload {
    owner: string;
    name: string;
}

export class Transaction<T extends TxBody | HexlifiedTxBody> implements TxnData<T> {
    private readonly data: Readonly<TxnData<T>>;

    constructor(data?: NonNil<TxnData<T>>) {
        this.data = data || {
            signature: {
                signature_bytes: "",
                signature_type: SignatureType.SECP256K1_PERSONAL
            },
            body: {
                payload: "",
                payload_type: PayloadType.EXECUTE_ACTION,
                fee: "0",
                nonce: null,
                salt: "",
            } as T,
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

    public get body(): Readonly<T> {
        return this.data.body;
    }

    // noinspection JSUnusedLocalSymbols
    private toJSON(): Readonly<TxnData<T>> {
        return this.data;
    }
}

export namespace Txn {
    export function create<T extends TxBody | HexlifiedTxBody>(configure: (tx: TxnData<T>) => void): NonNil<Transaction<T>> {
        const tx = {
            body: {
                payload: "",
                payload_type: PayloadType.EXECUTE_ACTION,
                fee: "0",
                nonce: null,
                salt: "",
            } as T,
            signature: {
                signature_bytes: "",
                signature_type: SignatureType.SECP256K1_PERSONAL
            },
            sender: "",
        };

        configure(tx);

        return new Transaction(tx);
    }

    export function copy<T extends TxBody | HexlifiedTxBody>(source: NonNil<Transaction<TxBody | HexlifiedTxBody>>, configure: (tx: TxnData<T>) => void): NonNil<Transaction<T>> {
        return Txn.create((tx: TxnData<T>) => {
            tx.body = source.body as T;
            tx.signature = source.signature;
            tx.body = source.body as T;
            configure(tx);
        });
    }
}
