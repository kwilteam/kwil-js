import {BigNumberish, ethers, Signer} from "ethers";
import {FundingConfig} from "../core/configs";
import { EscrowV6 } from "./escrowV6";
import {TokenV6} from "./tokenV6";
import erc20Abi from './abi/erc20HumanAbi';
import kwilAbi from './abi/kwilHumanAbi';
import {AllowanceRes, BalanceRes, DepositRes, TokenRes} from "./types";
import { Signer as Signerv5, Wallet as Walletv5 } from "ethers5"
import { isV5Signer } from "../utils/crypto";
import { EscrowV5 } from "./escrowV5";
import { TokenV5 } from "./TokenV5";

/**
 * `Funder` class helps manage the funding process for a user's account on Kwil.
 */

export class Funder {
    private readonly signer: Signer | ethers.Wallet | Signerv5 | Walletv5;
    private readonly poolAddress: string;
    private readonly providerAddress: string;
    private erc20Contract?: TokenV6 | TokenV5;
    private escrowContract?: EscrowV6 | EscrowV5;

    private constructor(signer: Signer | ethers.Wallet | Signerv5 | Walletv5, config: FundingConfig) {
        this.poolAddress = config.pool_address;
        this.signer = signer;
        this.providerAddress = config.provider_address;
    }

    public static async create(signer: Signer | ethers.Wallet | Signerv5 | Walletv5, config: FundingConfig): Promise<Funder> {
        const funder = new Funder(signer, config);
        
        if(!isV5Signer(signer) || signer instanceof ethers.Wallet) {
            funder.escrowContract = new EscrowV6(funder.providerAddress, funder.poolAddress, kwilAbi, signer);
        
            let tokenAddress = await funder.escrowContract.getTokenAddress();
    
            funder.erc20Contract = new TokenV6(tokenAddress, erc20Abi, signer);
        }

        if(isV5Signer(signer) || signer instanceof Walletv5) {
            funder.escrowContract = new EscrowV5(funder.providerAddress, funder.poolAddress, kwilAbi, signer);
            
            let tokenAddress = await funder.escrowContract.getTokenAddress();

            funder.erc20Contract = new TokenV5(tokenAddress, erc20Abi, signer);
        }
        

        return funder;
    }

    /**
     * Retrieves the token allowance for a particular address.
     * 
     * @param address - The address to check the allowance for.
     * @returns A promise that resolves to the allowance result.
     */

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

    /**
     * Retrieves the wallet token balance for a particular address. The token is the token used for funding on the configured Kwil provider.
     * 
     * @param address - The address to check the balance for.
     * @returns A promise that resolves to the wallet token balance.
     */

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

     /**
     * Approves / set allowance for a certain amount of tokens for transfer.
     * 
     * @param amount - The amount to approve for transfer.
     * @returns A promise that resolves to the transaction response.
     */

    public async approve(amount: BigNumberish): Promise<ethers.ContractTransactionResponse> {
        if (!this.erc20Contract) {
            throw new Error("Funder not initialized");
        }
        return await this.erc20Contract.approve(this.poolAddress, amount);
    }

    /**
     * Deposits a certain amount of tokens. Funds must be approved before depositing.
     * 
     * @param amount - The amount to deposit.
     * @returns A promise that resolves to the transaction response.
     */

    public async deposit(amount: BigNumberish): Promise<ethers.ContractTransactionResponse> {
        if (!this.escrowContract) {
            throw new Error("Funder not initialized");
        }
        return await this.escrowContract.deposit(amount);
    }

    /**
     * Retrieves the deposited balance for a particular address.
     * 
     * @param address - The address to check the deposited balance for.
     * @returns A promise that resolves to the deposited balance result.
     */

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

    /**
     * Retrieves the address of the token contract for the configured Kwil provider.
     * 
     * @returns A promise that resolves to the token address result.
     */

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