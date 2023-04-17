import { BigNumberish, ethers, JsonRpcSigner } from "ethers";
import { FundingConfig } from "../interfaces/configs";
import { AllowanceRes, BalanceRes, DepositRes, TokenRes } from "../interfaces/funding";
export declare class Funder {
    private signer;
    private poolAddress;
    private providerAddress;
    private erc20Contract?;
    private escrowContract?;
    constructor(signer: JsonRpcSigner | ethers.Wallet, config: FundingConfig);
    init(): Promise<void>;
    getAllowance(address: string): Promise<AllowanceRes>;
    getBalance(address: string): Promise<BalanceRes>;
    approve(amount: BigNumberish): Promise<ethers.ContractTransaction>;
    deposit(amount: BigNumberish): Promise<ethers.ContractTransaction>;
    getDepositedBalance(address: string): Promise<DepositRes>;
    getTokenAddress(): Promise<TokenRes>;
}
