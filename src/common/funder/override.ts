import { ethers } from "ethers";

export async function createOverride(provider: ethers.providers.JsonRpcSigner | ethers.Wallet, contract: ethers.Contract, method: string, args: any[]): Promise<object> {
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