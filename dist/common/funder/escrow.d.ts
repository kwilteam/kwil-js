import { ethers } from 'ethers';
export declare class Escrow {
    private contract;
    private provider;
    private tokenAddress?;
    private validatorAddress;
    constructor(validatorAddress: string, poolAddress: string, abi: ethers.ContractInterface, provider: ethers.providers.JsonRpcSigner | ethers.Wallet);
    getTokenAddress(): Promise<string>;
    getDepositedBalance(address: string): Promise<ethers.BigNumber>;
    private createOverride;
    deposit(amount: ethers.BigNumber, override?: object): Promise<ethers.ContractTransaction>;
}
