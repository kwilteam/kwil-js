import { ethers } from "ethers";
import { FundingConfig } from "../interfaces/configs";
import { Escrow } from "./escrow";
import { Token } from "./token";
import erc20Abi from './abi/erc20.json';
import kwilAbi from './abi/kwil.json';
import { AllowanceRes, BalanceRes, DepositRes, TokenRes } from "../interfaces/funding";

export class Funder {
    private signer: ethers.providers.JsonRpcSigner | ethers.Wallet;
    private poolAddress: string;
    private providerAddress: string;
    private erc20Contract?: Token;
    private escrowContract?: Escrow;

    constructor(signer: ethers.providers.JsonRpcSigner | ethers.Wallet, config: FundingConfig) {
        this.poolAddress = config.pool_address;
        this.signer = signer;
        this.providerAddress = config.provider_address;
    }

    public async init(): Promise<void> {
        this.escrowContract = new Escrow(this.providerAddress, this.poolAddress, kwilAbi, this.signer);
        let tokenAddress = await this.escrowContract.getTokenAddress();

        this.erc20Contract = new Token(tokenAddress, erc20Abi, this.signer);
    }

    public async getAllowance(address: string): Promise<AllowanceRes> {
        if (!this.erc20Contract) {
            throw new Error("Funder not initialized");
        }
        const res = await this.erc20Contract.getAllowance(address, this.poolAddress);
        const num = ethers.BigNumber.from(res._hex);
        return {
            allowance_balance: num.toString(),
        }
    }

    public async getBalance(address: string): Promise<BalanceRes> {
        if (!this.erc20Contract) {
            throw new Error("Funder not initialized");
        }
        const res = await this.erc20Contract.getBalance(address);
        const num = ethers.BigNumber.from(res._hex);
        return {
            balance: num.toString(),
        }
    }

    public async approve(amount: ethers.BigNumber): Promise<ethers.ContractTransaction> {
        if (!this.erc20Contract) {
            throw new Error("Funder not initialized");
        }
        return await this.erc20Contract.approve(this.poolAddress, amount);
    }

    public async deposit(amount: ethers.BigNumber): Promise<ethers.ContractTransaction> {
        if (!this.escrowContract) {
            throw new Error("Funder not initialized");
        }
        return await this.escrowContract.deposit(amount);
    }

    public async getDepositedBalance(address: string): Promise<DepositRes> {
        if (!this.escrowContract) {
            throw new Error("Funder not initialized");
        }
        const res = await this.escrowContract.getDepositedBalance(address);
        const num = ethers.BigNumber.from(res._hex);
        return {
            deposited_balance: num.toString(),
        }
    }

    public async getTokenAddress(): Promise<TokenRes> {
        if (!this.escrowContract) {
            throw new Error("Funder not initialized");
        }
        const res = await this.escrowContract.getTokenAddress();
        return {
            token_address: res,
        }
    }
}