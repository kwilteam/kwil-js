import { BigNumberish, ethers, JsonRpcSigner } from "ethers";
import { FundingConfig } from "../core/configs";
import { Escrow } from "./escrow";
import { Token } from "./token";
import erc20Abi from './abi/erc20HumanAbi';
import kwilAbi from './abi/kwilHumanAbi';
import { AllowanceRes, BalanceRes, DepositRes, TokenRes } from "./types";

export class Funder {
    private readonly signer: JsonRpcSigner | ethers.Wallet;
    private readonly poolAddress: string;
    private readonly providerAddress: string;
    private erc20Contract?: Token;
    private escrowContract?: Escrow;

    private constructor(signer: JsonRpcSigner | ethers.Wallet, config: FundingConfig) {
        this.poolAddress = config.pool_address;
        this.signer = signer;
        this.providerAddress = config.provider_address;
    }

    public static async create(signer: JsonRpcSigner | ethers.Wallet, config: FundingConfig): Promise<Funder> {
        const funder = new Funder(signer, config);
        funder.escrowContract = new Escrow(funder.providerAddress, funder.poolAddress, kwilAbi, funder.signer);
        
        let tokenAddress = await funder.escrowContract.getTokenAddress();

        funder.erc20Contract = new Token(tokenAddress, erc20Abi, funder.signer);

        return funder;
    }

    public async getAllowance(address: string): Promise<AllowanceRes> {
        if (!this.erc20Contract) {
            throw new Error("Funder not initialized");
        }
        const res = await this.erc20Contract.getAllowance(address, this.poolAddress);
        const num = BigInt(res);
        return {
            allowance_balance: num.toString(),
        }
    }

    public async getBalance(address: string): Promise<BalanceRes> {
        if (!this.erc20Contract) {
            throw new Error("Funder not initialized");
        }
        const res = await this.erc20Contract.getBalance(address);
        const num = BigInt(res);
        return {
            balance: num.toString(),
        }
    }

    public async approve(amount: BigNumberish): Promise<ethers.ContractTransaction> {
        if (!this.erc20Contract) {
            throw new Error("Funder not initialized");
        }
        return await this.erc20Contract.approve(this.poolAddress, amount);
    }

    public async deposit(amount: BigNumberish): Promise<ethers.ContractTransaction> {
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
        const num = BigInt(res);
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