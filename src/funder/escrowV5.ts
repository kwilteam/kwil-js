import { BigNumberish, ContractTransactionResponse } from "ethers";
import { Contract, ContractInterface, Signer, ethers } from "ethers5"

export async function v5Override(provider: Signer | ethers.Wallet, contract: ethers.Contract, method: string, args: any[]): Promise<object> {
    // if provider is jsonrpc, then this gas esimates will be made by provider
    if (provider instanceof ethers.providers.JsonRpcProvider) {
        return {};
    }

    let gas = await contract.estimateGas[method](...args);
    const fee = await contract.provider.getFeeData();
    
    // gas as ethers.BigNumber
    gas = ethers.BigNumber.from(gas);

    // multiply by 1.3
    gas = gas.mul(13).div(10);

    return {
        gasPrice: fee.gasPrice,
        gasLimit: gas
    }
}

export class EscrowV5 {
    private readonly contract: Contract;
    private readonly signer: Signer | ethers.Wallet;
    private tokenAddress?: Promise<string>;
    private readonly validatorAddress: string;

    constructor(validatorAddress: string, poolAddress: string, abi: ContractInterface, signer: Signer | ethers.Wallet) {
        this.contract = new Contract(poolAddress, abi, signer);
        this.signer = signer;
        this.validatorAddress = validatorAddress;
    }

    public async getTokenAddress(): Promise<string> {
        if(this.tokenAddress) {
            return this.tokenAddress;
        }

        const addr = await this.contract.escrowToken();
        this.tokenAddress = addr;
        return addr;
    }

    public async getDepositedBalance(address: String): Promise<BigNumberish> {
        return this.contract.pools(this.validatorAddress, address);
    }

    private async createOverride(method: string, args: any[]): Promise<object> {
        return await v5Override(this.signer, this.contract, method, args);
    }

    public async deposit(amount: BigNumberish, override?: object): Promise<ContractTransactionResponse> {
        if (!override) {
            override = this.createOverride('deposit', [this.validatorAddress, amount]);
        }
        
        return await this.contract.deposit(this.validatorAddress, amount, override);
    }
}