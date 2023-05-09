import { ethers, Signer } from "ethers";
export declare function createOverride(provider: Signer | ethers.Wallet, contract: ethers.Contract, method: string, args: any[]): Promise<object>;
