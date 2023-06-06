import { Signer, Wallet, providers } from "ethers5";
import { NodeKwil } from "../dist";
import { JSDOM } from "jsdom";
import { Funder } from "../dist/funder/funding";
import { FunderObj, waitForConfirmations, wallet } from "./testingUtils";
import { AllowanceRes, BalanceRes, DepositRes, TokenRes } from "../dist/funder/types";
import { ContractTransactionResponse } from "ethers";


describe("All node funder operations should work with Ethersv5 Wallet and Signer", () => {
    const kwil = new NodeKwil({
        kwilProvider: "https://provider.kwil.com",
        timeout: 10000,
        logging: true,
    })

    let funder: Funder;

    beforeAll(async () => {
        try {
            funder = await kwil.getFunder(wallet);
        } catch (error) {
            console.log(error)
        }
    })

    test('kwil.getFunder should return a funder', () => {
        expect(funder).toBeDefined();
        expect(funder).toMatchObject<FunderObj>({
            poolAddress: expect.any(String),
            signer: expect.objectContaining({
                address: '0xAfFDC06cF34aFD7D5801A13d48C92AD39609901D',
                provider: expect.any(Object),
            }),
            providerAddress: expect.any(String),
            escrowContract: expect.any(Object),
            erc20Contract: expect.any(Object),
        })
    });

    test('getAllowance should return allowanceRes', async () => {
        const result = await funder.getAllowance(wallet.address);
        expect(result).toBeDefined();
        expect(result).toMatchObject<AllowanceRes>({
            allowance_balance: expect.any(String),
        })
        console.log(result)
    });

    test('getBalance should return balanceRes', async () => {
        const result = await funder.getBalance(wallet.address);
        expect(result).toBeDefined();
        expect(result).toMatchObject<BalanceRes>({
            balance: expect.any(String),
        })
    });

    test('approve should return a transaction', async () => {
        const funder = await kwil.getFunder(wallet);
        const result = await funder.approve(100) as ContractTransactionResponse;
        expect(result).toBeDefined();
        expect(result).toMatchObject({
            to: expect.any(String),
            from: expect.any(String),
            value: expect.any(BigInt),
            chainId: expect.any(BigInt),
        });

        const hash = result.hash;

        console.log("Waiting for confirmations...")
        await waitForConfirmations(hash, 1);

    }, 40000);

    test('deposit should return a transaction', async () => {
        const result = await funder.deposit(100);
        expect(result).toBeDefined();
        expect(result).toMatchObject({
            to: expect.any(String),
            from: expect.any(String),
            value: expect.any(BigInt),
            chainId: expect.any(BigInt),
        });
    }, 10000);

    test('getDepositedBalance should return a balance', async () => {
        const result = await funder.getDepositedBalance(wallet.address);
        expect(result).toBeDefined();
        expect(result).toMatchObject<DepositRes>({
            deposited_balance: expect.any(String),
        })
        console.log(result)
    });

    test('getTokenAddress should return a token address', async () => {
        const result = await funder.getTokenAddress();
        expect(result).toBeDefined();
        expect(result).toMatchObject<TokenRes>({
            token_address: expect.any(String),
        })
    });
})