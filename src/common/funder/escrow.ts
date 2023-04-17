import {BigNumberish, ethers, JsonRpcSigner} from 'ethers';
import {createOverride} from './override';

export class Escrow {
    private contract: ethers.Contract;
    private provider: JsonRpcSigner | ethers.Wallet;
    private tokenAddress?: string;
    private validatorAddress: string;
    constructor(validatorAddress: string, poolAddress: string, abi: ethers.InterfaceAbi, provider: JsonRpcSigner | ethers.Wallet) {
        this.contract = new ethers.Contract(poolAddress, abi, provider);
        this.provider = provider;
        this.validatorAddress = validatorAddress;
    }

    public async getTokenAddress(): Promise<string> {
        if (this.tokenAddress) {
            return this.tokenAddress;
        }

        const addr = await this.contract.escrowToken();
        this.tokenAddress = addr;
        return addr;
    }

    public async getDepositedBalance(address: string): Promise<BigNumberish> {
        return await this.contract.pools(this.validatorAddress, address);
    }

    private async createOverride(method: string, args: any[]): Promise<object> {
        return await createOverride(this.provider, this.contract, method, args);
    }

    public async deposit(amount: BigNumberish, override?: object): Promise<ethers.ContractTransaction> {
        if (!override) {
            override = this.createOverride('deposit', [this.validatorAddress, amount]);
        }
        
        return await this.contract.deposit(this.validatorAddress, amount, override);
    }
}