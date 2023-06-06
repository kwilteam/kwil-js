import {BigNumberish, ethers, Signer} from 'ethers';
import {createOverride} from './override';

export class EscrowV6 {
    private readonly contract: ethers.Contract;
    private readonly signer: Signer | ethers.Wallet;
    private tokenAddress?: Promise<string>;
    private readonly validatorAddress: string;

    constructor(validatorAddress: string, poolAddress: string, abi: ethers.InterfaceAbi, signer: Signer | ethers.Wallet) {
        this.contract = new ethers.Contract(poolAddress, abi, signer);
        this.signer = signer;
        this.validatorAddress = validatorAddress;
    }

    public getTokenAddress(): Promise<string> {
        if (!this.tokenAddress) {
            this.tokenAddress = this.contract['escrowToken()']();
        }

        return this.tokenAddress;
    }

    public async getDepositedBalance(address: string): Promise<BigNumberish> {
        return this.contract['pools(address, address)'](this.validatorAddress, address);
    }

    private async createOverride(method: string, args: any[]): Promise<object> {
        return createOverride(this.signer, this.contract, method, args);
    }

    public async deposit(amount: BigNumberish, override?: object): Promise<ethers.ContractTransactionResponse> {
        if (!override) {
            override = this.createOverride('deposit', [this.validatorAddress, amount]);
        }
        
        return this.contract["deposit(address validator, uint256 amt)"](this.validatorAddress, amount, override);
    }
}