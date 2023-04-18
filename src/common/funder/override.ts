import { ethers, FeeData, JsonRpcProvider, JsonRpcSigner } from "ethers";

export async function createOverride(provider: JsonRpcSigner | ethers.Wallet, contract: ethers.Contract, method: string, args: any[]): Promise<object> {
    // if provider is jsonrpc, then this gas esimates will be made by provider
    if (provider instanceof JsonRpcProvider) {
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