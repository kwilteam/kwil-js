import { ethers } from "ethers";
export declare function createOverride(provider: ethers.providers.JsonRpcSigner | ethers.Wallet, contract: ethers.Contract, method: string, args: any[]): Promise<object>;
