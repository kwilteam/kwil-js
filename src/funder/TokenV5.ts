import { Contract, Signer, ethers } from "ethers5";
import { v5Override } from "./escrowV5";
import { BigNumberish, ContractTransactionResponse } from "ethers";


export class TokenV5 {
    private readonly contract: Contract;
    private readonly signer: Signer | ethers.Wallet;
    private name?: Promise<string>;
    private symbol?: Promise<string>;
    private decimals?: Promise<number>;
    private totalSupply?: Promise<number>;

    constructor(tokenAddress: string, abi: ethers.ContractInterface, signer: Signer | ethers.Wallet) {
        this.contract = new Contract(tokenAddress, abi, signer);
        this.signer = signer;
    }

    public async getName(): Promise<string> {
        if (this.name) {
            return this.name;
        }

        const name = await this.contract.name();
        this.name = name;
        return name;
    }

    public async getSymbol(): Promise<string> {
        if (this.symbol) {
            return this.symbol;
        }

        const symbol = await this.contract.symbol();
        this.symbol = symbol;
        return symbol;
    }

    public async getDecimals(): Promise<number> {
        if (this.decimals) {
            return this.decimals;
        }

        const decimals = await this.contract.decimals();
        this.decimals = decimals;
        return decimals;
    }

    public async getTotalSupply(): Promise<number> {
        if (this.totalSupply) {
            return this.totalSupply;
        }

        const totalSupply = await this.contract.totalSupply();
        this.totalSupply = totalSupply;
        return totalSupply;
    }

    public async getBalance(address: string): Promise<BigNumberish> {
        const balance = await this.contract.balanceOf(address);
        return balance;
    }

    public async getAllowance(owner: string, spender: string): Promise<BigNumberish> {
        const allowance = await this.contract.allowance(owner, spender);
        return allowance;
    }

    private async createOverride(method: string, args: any[]): Promise<object> {
        return await v5Override(this.signer, this.contract, method, args);
    }

    public async approve(spender: string, amount: BigNumberish, override?: object): Promise<ContractTransactionResponse> {
        if (!override) {
            override = this.createOverride('approve', [spender, amount]);
        }

        return await this.contract.approve(spender, amount, override);
    }
}
