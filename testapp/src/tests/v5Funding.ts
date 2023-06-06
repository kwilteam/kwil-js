import { kwil } from "./testUtils";
import { providers } from 'ethers5'
import { ContractTransactionResponse } from 'ethers';

export async function testV5Funding() {
    await window.ethereum.enable();

    const provider = new providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner()
    const address = await signer.getAddress()

    const funder = await kwil.getFunder(signer)

    const allowance = await funder.getAllowance(address)
    console.log("allowance", allowance)
    console.log("allowance works:", typeof allowance.allowance_balance === "string") 

    const balance = await funder.getBalance(address)
    console.log("balance", balance)
    console.log("balance works:", typeof balance.balance === "string")

    const approve = await funder.approve(100)
    console.log("approve", approve)
    await provider.waitForTransaction(approve.hash)
    console.log("approve works:", approve instanceof ContractTransactionResponse)

    

    const deposit = await funder.deposit(100)
    console.log("deposit", deposit)
    await provider.waitForTransaction(deposit.hash)
    console.log("deposit works:", deposit instanceof ContractTransactionResponse)
    

    const depositedBalance = await funder.getDepositedBalance(address)
    console.log("depositedBalance", depositedBalance)
    console.log("depositedBalance works:", typeof depositedBalance.deposited_balance === "string")

    const getTokenAddress = await funder.getTokenAddress()
    console.log("getTokenAddress", getTokenAddress)
    console.log("getTokenAddress works:", typeof getTokenAddress.token_address === "string")
}