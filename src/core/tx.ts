import {Nillable, NonNil} from "../utils/types";
import {Signature, SignatureType} from "./signature";

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

export interface Transaction extends Readonly<TxnData> {
    isSigned(): boolean;
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
            isSigned: () => false,
            sender: "",
        };

        configure(tx);

        return tx;
    }

    export function copy(source: NonNil<Transaction>, configure: (tx: TxnData) => void): NonNil<Transaction> {
        return Txn.create((tx) => {
            tx.hash = "";
            tx.payload_type = source.payload_type;
            tx.payload = source.payload;
            tx.fee = source.fee;
            tx.nonce = source.nonce;
            tx.signature = source.signature;
            tx.sender = source.sender;
            configure(tx);
        });
    }
}
