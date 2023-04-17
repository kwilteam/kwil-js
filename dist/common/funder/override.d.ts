import { ethers, JsonRpcSigner } from "ethers";
export declare function createOverride(provider: JsonRpcSigner | ethers.Wallet, contract: ethers.Contract, method: string, args: any[]): Promise<object>;
