import { BigNumberish, ethers, InterfaceAbi, JsonRpcSigner } from "ethers";
import { createOverride } from "./override";

export class Token{
    private contract: ethers.Contract;
    private provider: JsonRpcSigner | ethers.Wallet;
    private name?: string;
    private symbol?: string;
    private decimals?: number;
    private totalSupply?: number;

    constructor(tokenAddress: string, abi: InterfaceAbi, provider: JsonRpcSigner | ethers.Wallet){
        this.contract = new ethers.Contract(tokenAddress, abi, provider)
        this.provider = provider;
    }

    public async getName(): Promise<string> {
        if (this.name) {
            return this.name;
        }

        const name = await this.contract['name()']();
        this.name = name;
        return name;
    }

    public async getSymbol(): Promise<string> {
        if (this.symbol) {
            return this.symbol;
        }

        const symbol = await this.contract['symbol()']();
        this.symbol = symbol;
        return symbol;
    }

    public async getDecimals(): Promise<number> {
        if (this.decimals) {
            return this.decimals;
        }

        const decimals = await this.contract['decimals()']()
        this.decimals = decimals;
        return decimals;
    }

    public async getTotalSupply(): Promise<number> {
        if (this.totalSupply) {
            return this.totalSupply;
        }

        const totalSupply = await this.contract['totalSupply()']();
        this.totalSupply = totalSupply;
        return totalSupply;
    }

    public async getBalance(address: string): Promise<BigNumberish> {
        const balance = await this.contract['balanceOf(address _owner)'](address);
        return balance;
    }

    public async getAllowance(owner: string, spender: string): Promise<BigNumberish> {
        const allowance = await this.contract['allowance(address _owner, address _spender)'](owner, spender);
        return allowance;
    }

    // createOverride is a function to calculate method gas costs
    private async createOverride(method: string, args: any[]): Promise<object> {
        return await createOverride(this.provider, this.contract, method, args);
    }

    public async approve(spender: string, amount: BigNumberish, override?: object): Promise<ethers.ContractTransaction> {
        if (!override) {
            override = this.createOverride('approve', [spender, amount]);
        }

        return await this.contract["approve(address _spender, uint256 _value)"](spender, amount, override);
    }
}