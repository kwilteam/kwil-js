import { Signer } from "ethers";
import { ethers, FeeData, JsonRpcProvider } from "ethers";

export async function createOverride(provider: Signer | ethers.Wallet, contract: ethers.Contract, method: string, args: any[]): Promise<object> {
    // if provider is jsonrpc, then this gas estimates will be made by provider
    if (provider instanceof JsonRpcProvider) {
        //TODO: verify this is the correct type check (e.g., provider.provider vs provider)
        return {};
    }

    let gas = await contract[method].estimateGas(...args);
    const fee = new FeeData(gas);
    
    // gas as ethers.BigNumber
    gas = BigInt(gas);

    // multiply by 1.3
    gas = gas * (BigInt(13) / BigInt(10));

    return {
        gasPrice: fee.gasPrice,
        gasLimit: gas
    }
}