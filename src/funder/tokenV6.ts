import {BigNumberish, ethers, InterfaceAbi, Signer} from "ethers";
import {createOverride} from "./override";

export class TokenV6{
    private readonly contract: ethers.Contract;
    private readonly provider: Signer | ethers.Wallet;
    private name?: Promise<string>;
    private symbol?: Promise<string>;
    private decimals?: Promise<number>;
    private totalSupply?: Promise<number>;

    constructor(tokenAddress: string, abi: InterfaceAbi, provider: Signer | ethers.Wallet){
        this.contract = new ethers.Contract(tokenAddress, abi, provider)
        this.provider = provider;
    }

    public async getName(): Promise<string> {
        if (!this.name) {
            this.name = this.contract['name()']();
        }

        return this.name;
    }

    public async getSymbol(): Promise<string> {
        if (!this.symbol) {
            this.symbol = this.contract['symbol()']();
        }

        return this.symbol;
    }

    public async getDecimals(): Promise<number> {
        if (!this.decimals) {
            this.decimals = this.contract['decimals()']();
        }

        return this.decimals;
    }

    public getTotalSupply(): Promise<number> {
        if (!this.totalSupply) {
            this.totalSupply = this.contract['totalSupply()']();
        }

        return this.totalSupply;
    }

    public getBalance(address: string): Promise<BigNumberish> {
        return this.contract['balanceOf(address _owner)'](address);
    }

    public getAllowance(owner: string, spender: string): Promise<BigNumberish> {
        return this.contract['allowance(address _owner, address _spender)'](owner, spender);
    }

    // createOverride is a function to calculate method gas costs
    private createOverride(method: string, args: any[]): Promise<object> {
        return createOverride(this.provider, this.contract, method, args);
    }

    public approve(spender: string, amount: BigNumberish, override?: object): Promise<ethers.ContractTransactionResponse> {
        if (!override) {
            override = this.createOverride('approve', [spender, amount]);
        }

        return this.contract["approve(address _spender, uint256 _value)"](spender, amount, override);
    }
}