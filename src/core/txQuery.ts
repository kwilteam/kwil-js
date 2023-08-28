import { TxnData } from "./tx";


export interface TxResult {
    code: number;
    log: string;
    gasUsed: number;
    gasWanted: number;
    data: string;
    events: string[]
}

export interface TxInfoReceipt {
    get hash(): string;
    get height(): number;
    get tx(): TxnData;
    get txResult(): TxResult;
}