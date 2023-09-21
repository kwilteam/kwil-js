import { Contract, JsonRpcProvider, JsonRpcSigner, Wallet } from "ethers";
import {Kwil} from "../dist/client/kwil";
import { NodeKwil, Utils } from "../dist";
import scrypt from 'scrypt-js';
import nacl from 'tweetnacl';
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
    kwilProvider: process.env.KWIL_PROVIDER || "SHOULD FAIL",
    timeout: 10000,
    logging: true
})


export function waitForDeployment(hash: string): Promise<boolean> {
    return new Promise(async (resolve) => {
        setTimeout(async () => {
            try {
                const txQuery = await kwil.txInfo(hash);

                if (txQuery.status === 200 && txQuery.data?.tx_result.log === 'success') {
                    resolve(true);
                } else {
                    // Retry after 500ms if it's not a success
                    resolve(await waitForDeployment(hash));
                }
            } catch (err) {
                console.error("SDK Error:", err); // optionally log the error
                // Instead of rejecting, retry
                resolve(await waitForDeployment(hash));
            }
        }, 500);
    });
}

export const deriveKeyPair64 = async (password: string, humanId: string) => {
    const encoder = new TextEncoder();

    const normalizedPassword = encoder.encode(password.normalize("NFKC"));
    const salt = encoder.encode(humanId);

    const derivedKey = await scrypt.scrypt(normalizedPassword, salt, 1024, 8, 1, 32);

    return nacl.sign.keyPair.fromSeed(derivedKey);
};