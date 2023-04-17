import { BigNumberish, ethers, InterfaceAbi, JsonRpcSigner } from "ethers";
export declare class Token {
    private contract;
    private provider;
    private name?;
    private symbol?;
    private decimals?;
    private totalSupply?;
    constructor(tokenAddress: string, abi: InterfaceAbi, provider: JsonRpcSigner | ethers.Wallet);
    getName(): Promise<string>;
    getSymbol(): Promise<string>;
    getDecimals(): Promise<number>;
    getTotalSupply(): Promise<number>;
    getBalance(address: string): Promise<BigNumberish>;
    getAllowance(owner: string, spender: string): Promise<BigNumberish>;
    private createOverride;
    approve(spender: string, amount: BigNumberish, override?: object): Promise<ethers.ContractTransaction>;
}
