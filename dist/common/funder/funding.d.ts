import { BigNumberish, ethers, Signer } from "ethers";
import { FundingConfig } from "../interfaces/configs";
import { AllowanceRes, BalanceRes, DepositRes, TokenRes } from "../interfaces/funding";
export declare class Funder {
    private readonly signer;
    private readonly poolAddress;
    private readonly providerAddress;
    private erc20Contract?;
    private escrowContract?;
    private constructor();
    static create(signer: Signer | ethers.Wallet, config: FundingConfig): Promise<Funder>;
    getAllowance(address: string): Promise<AllowanceRes>;
    getBalance(address: string): Promise<BalanceRes>;
    approve(amount: BigNumberish): Promise<ethers.ContractTransactionResponse>;
    deposit(amount: BigNumberish): Promise<ethers.ContractTransactionResponse>;
    getDepositedBalance(address: string): Promise<DepositRes>;
    getTokenAddress(): Promise<TokenRes>;
}
