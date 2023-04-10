import { ethers } from "ethers";
export declare class Token {
    private contract;
    private provider;
    private name?;
    private symbol?;
    private decimals?;
    private totalSupply?;
    constructor(tokenAddress: string, abi: ethers.ContractInterface, provider: ethers.providers.JsonRpcSigner | ethers.Wallet);
    getName(): Promise<string>;
    getSymbol(): Promise<string>;
    getDecimals(): Promise<number>;
    getTotalSupply(): Promise<number>;
    getBalance(address: string): Promise<ethers.BigNumber>;
    getAllowance(owner: string, spender: string): Promise<ethers.BigNumber>;
    private createOverride;
    approve(spender: string, amount: ethers.BigNumber, override?: object): Promise<ethers.ContractTransaction>;
}
