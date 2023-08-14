import { Wallet, providers } from "ethers5";
import { NodeKwil, Types, Utils } from "../dist";
import { Funder } from "../dist/funder/funding";
import { AmntObject, FunderObj, kwil } from "./testingUtils";
import { AllowanceRes, BalanceRes, DepositRes, TokenRes } from "../dist/funder/types";
import { ContractTransactionResponse } from "ethers";
import { ActionBuilder } from "../dist/core/builders";
import { ActionBuilderImpl } from "../dist/builders/action_builder";
import { Transaction, TxReceipt } from "../dist/core/tx";
require('dotenv').config();

const provider = process.env.ETH_PROVIDER === "https://provider.kwil.com" ? new providers.InfuraProvider("goerli") : process.env.ETH_PROVIDER ? new providers.JsonRpcProvider(process.env.ETH_PROVIDER) : new providers.JsonRpcProvider("http://localhost:8545");
const wallet = new Wallet(process.env.PRIVATE_KEY as string, provider);

const dbid = kwil.getDBID(wallet.address, "mydb")

describe("All node funder operations should work with Ethersv5 Wallet and Signer", () => {
    const kwil = new NodeKwil({
        kwilProvider: process.env.KWIL_PROVIDER || 'should fail',
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
                address: wallet.address,
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
            hash: expect.any(String),
            chainId: expect.any(Number),
        });

        const hash = result.hash;

        console.log("Waiting for confirmations...")
        await provider.waitForTransaction(hash, 1);
    }, 40000);

    test('deposit should return a transaction', async () => {
        const result = await funder.deposit(100);
        expect(result).toBeDefined();
        expect(result).toMatchObject({
            to: expect.any(String),
            from: expect.any(String),
            hash: expect.any(String),
            chainId: expect.any(Number),
        });
    }, 10000);

    test('getDepositedBalance should return a balance', async () => {
        const result = await funder.getDepositedBalance(wallet.address);
        expect(result).toBeDefined();
        expect(result).toMatchObject<DepositRes>({
            deposited_balance: expect.any(String),
        })
    });

    test('getTokenAddress should return a token address', async () => {
        const result = await funder.getTokenAddress();
        expect(result).toBeDefined();
        expect(result).toMatchObject<TokenRes>({
            token_address: expect.any(String),
        })
    });
})

describe("ActionBuilder + Transaction signing works with Ethersv5 Wallet and Signer", () => {
    let actionBuilder: ActionBuilder;
    let recordCount: number;
    let actionInput: Types.ActionInput;

    beforeAll(async () => {
        actionBuilder = kwil
            .actionBuilder()
            .dbid(dbid)
            .name("add_post")

        const count = await kwil.selectQuery(dbid, "SELECT COUNT(*) FROM posts");
        if (count.status == 200 && count.data) {
            const amnt = count.data[0] as AmntObject;
            recordCount = amnt['COUNT(*)'];
        } 
        
        actionInput = new Utils.ActionInput();
    })

    test('actionInput.put with complete inputs should return the actionInput + inputs', () => {
        actionInput.put("$id", recordCount + 1);
        actionInput.put("$user", "Luke");
        actionInput.put("$title", "Test Post");
        actionInput.put("$body", "This is a test post");

        expect(actionInput).toBeDefined();
        expect(actionInput.get("$id")).toBe(recordCount + 1);
        expect(actionInput.get("$user")).toBe("Luke");
        expect(actionInput.get("$title")).toBe("Test Post");
        expect(actionInput.get("$body")).toBe("This is a test post");
    })

    test("The actionBuilder.concat() method should return an actionBuilder with the given inputs", () => {
        const result = actionBuilder
            .concat(actionInput)

        expect(result).toBeDefined();
        expect(result).toBeInstanceOf(ActionBuilderImpl);
        expect(result).toBe(actionBuilder);
    });

    test("The actionBuilder.signer() method should returned a signed ActionBuilder", () => {
        const result = actionBuilder.signer(wallet);

        expect(result).toBeDefined();
        expect(result).toBeInstanceOf(ActionBuilderImpl);
        expect(result).toBe(actionBuilder);
    })

    let actionTx: Transaction;

    test("The actionBuilder.buildTx() method should return a signed transaction", async () => {
        actionTx = await actionBuilder.buildTx();

        expect(actionTx).toBeDefined();
        expect(actionTx).toBeInstanceOf(Transaction);
        expect(actionTx.isSigned()).toBe(true);
    });

    test("All methods and getters on the Transaction class should return the correct values", () => {
        expect(actionTx).toBeDefined();
        expect(actionTx).toBeInstanceOf(Transaction);
        expect(actionTx.isSigned()).toBe(true);
        expect(actionTx.hash).toBeDefined();
        expect(actionTx.payload_type).toBeDefined();
        expect(actionTx.payload).toBeDefined();
        expect(actionTx.fee).toBeDefined();
        expect(actionTx.fee).not.toBe("0");
        expect(actionTx.nonce).toBeGreaterThan(-1);
        expect(actionTx.signature).toBeDefined();
        expect(actionTx.signature.signature_bytes).toBeDefined();
        expect(actionTx.signature.signature_bytes).not.toHaveLength(0);
        expect(actionTx.signature.signature_type).toBeDefined();
    });

    test("The kwil.broadcast() method should accept a transaction and return a txHash and a txReceipt", async () => {
        const result = await kwil.broadcast(actionTx);
        expect(result.data).toBeDefined();
        expect(result.data).toMatchObject<TxReceipt>({
            txHash: expect.any(String),
            fee: expect.any(String),
            body: expect.any(Array),
        });
    });
});