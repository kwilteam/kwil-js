import { BigNumberish, ethers, JsonRpcSigner } from 'ethers';
export declare class Escrow {
    private contract;
    private provider;
    private tokenAddress?;
    private validatorAddress;
    constructor(validatorAddress: string, poolAddress: string, abi: ethers.InterfaceAbi, provider: JsonRpcSigner | ethers.Wallet);
    getTokenAddress(): Promise<string>;
    getDepositedBalance(address: string): Promise<BigNumberish>;
    private createOverride;
    deposit(amount: BigNumberish, override?: object): Promise<ethers.ContractTransaction>;
}
