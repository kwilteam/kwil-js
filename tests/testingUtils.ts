import { Contract, JsonRpcProvider, JsonRpcSigner, Wallet } from "ethers";
import {Kwil} from "../dist/client/kwil";
import { NodeKwil } from "../dist";
require('dotenv').config();

const provider = new JsonRpcProvider(process.env.ETH_PROVIDER)
export const wallet = new Wallet(process.env.PRIVATE_KEY as string, provider);

export async function waitForConfirmations(txHash: string, numConfirmations: number) {
    await provider.waitForTransaction(txHash, numConfirmations);
}

export interface ActionObj {
    dbid: string;
    name: string;
    inputs: string[];
}

export interface Escrow {
    contract: Contract;
    provider: Wallet;
    validatorAddress: string;
    tokenAddress: string;
}

export interface Token {
    contract: Contract;
    provider: Wallet | JsonRpcSigner;
    name?: string;
    symbol?: string;
    decimals?: number;
    totalSupply?: number;
}

export interface FunderObj {
    poolAddress: string;
    signer: Wallet;
    providerAddress: string;
    escrowContract: Escrow;
    erc20Contract: Token;
}

export interface AmntObject {
    "COUNT(*)": number;
}

export interface schemaObj {
    owner: string;
    name: string;
    tables: object[];
    actions: object[];
}

export interface ActionObj {
    _name: string;
    _dbid: string;
}


export const kwil = new NodeKwil({
    kwilProvider: "http://localhost:54199",
    timeout: 10000,
    logging: true,
})

export const dbid = kwil.getDBID(wallet.address, "mydb")