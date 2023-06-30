import {Nillable, NonNil} from "../utils/types";
import {Signature, SignatureType} from "./signature";
import {strings} from "../utils/strings";

export enum PayloadType {
    INVALID_PAYLOAD_TYPE = 100,
    DEPLOY_DATABASE,
	MODIFY_DATABASE,
	DROP_DATABASE,
	EXECUTE_ACTION
}

export interface TxReceipt {
    get txHash(): string;
    get fee(): string;
    get body(): Nillable<string>;
}

export type TxnData = {
    hash: string;
    payload_type: PayloadType;
    payload: string;
    fee: string;
    nonce: number;
    signature: Signature;
    sender: string;
}

export interface DropDbPayload {
    owner: string;
    name: string;
}

export class Transaction implements TxnData {
    private readonly data: Readonly<TxnData>;

    constructor(data?: NonNil<TxnData>) {
        this.data = data || {
            hash: "",
            payload_type: PayloadType.EXECUTE_ACTION,
            payload: "",
            fee: "0",
            nonce: -1,
            signature: {
                signature_bytes: "",
                signature_type: SignatureType.ACCOUNT_SECP256K1_UNCOMPRESSED
            },
            sender: "",
        };
    }

    public isSigned(): boolean {
        return !strings.isNilOrEmpty(this.data.signature.signature_bytes);
    }

    public get hash(): string {
        return this.data.hash;
    }

    public get payload_type(): PayloadType {
        return this.data.payload_type;
    }

    public get payload(): string {
        return this.data.payload;
    }

    public get fee(): string {
        return this.data.fee;
    }

    public get nonce(): number {
        return this.data.nonce;
    }

    public get signature(): Readonly<Signature> {
        return this.data.signature;
    }

    public get sender(): string {
        return this.data.sender;
    }

    // noinspection JSUnusedLocalSymbols
    private toJSON(): Readonly<TxnData> {
        return this.data;
    }
}

export namespace Txn {
    export function create(configure: (tx: TxnData) => void): NonNil<Transaction> {
        const tx = {
            hash: "",
            payload_type: PayloadType.EXECUTE_ACTION,
            payload: "",
            fee: "0",
            nonce: -1,
            signature: {
                signature_bytes: "",
                signature_type: SignatureType.ACCOUNT_SECP256K1_UNCOMPRESSED
            },
            sender: "",
        };

        configure(tx);

        return new Transaction(tx);
    }

    export function copy(source: NonNil<Transaction>, configure: (tx: TxnData) => void): NonNil<Transaction> {
        return Txn.create((tx) => {
            tx.hash = "";
            tx.payload_type = source.payload_type;
            tx.payload = source.payload;
            tx.fee = source.fee;
            tx.nonce = source.nonce;
            tx.signature = {
                signature_bytes: "",
                signature_type: SignatureType.ACCOUNT_SECP256K1_UNCOMPRESSED
            };
            tx.sender = source.sender;
            configure(tx);
        });
    }
}
