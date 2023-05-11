import { ethers, Signer } from "ethers";
import { ITx, PayloadType } from "../interfaces/tx";
interface Txifiable {
    toObject(): object;
    payloadType: PayloadType;
}
export declare class Transaction {
    tx: ITx;
    constructor(tx: Txifiable);
    sign(signer: Signer | ethers.Wallet): Promise<void>;
    generateHash(): void;
}
export {};
