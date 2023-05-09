import { ContractTransactionResponse, Wallet } from "ethers";
import { Funder } from "../dist/common/funder/funding";
import { AllowanceRes, BalanceRes, DepositRes, TokenRes } from "../dist/common/interfaces/funding";
import { Action } from "../dist/common/action/action";
import { AnyMap } from "../dist/utils/anyMap";
import { Transaction } from "../dist/common/transactions/transaction";
import { TxReceipt } from "../dist/common/interfaces/tx";
import { DBBuilder } from "../dist/common/builder/builder";
import schema from "../testing-functions/test_schema.json";
import { wallet, waitForConfirmations, ActionObj, Escrow, Token, FunderObj, AmntObject, schemaObj, kwil } from "./testingUtils";


// Kwil methods that do NOT return another class (e.g. funder, action, and DBBuilder)
describe("Kwil", () => {
    test('getDBID should reutrn the correct value', () => {
        const result = kwil.getDBID(wallet.address, "mydb");
        expect(result).toBe("xca20642aa31af7db6b43755cf40be91c51a157e447e6cc36c1d94f0a");
    });

    test('getSchema should return status 200', async () => {
        const result = await kwil.getSchema("xca20642aa31af7db6b43755cf40be91c51a157e447e6cc36c1d94f0a");
        expect(result.status).toBe(200);
    })

    test('getAccount should return status 200', async () => {
        const result = await kwil.getAccount(wallet.address);
        expect(result.status).toBe(200);
    })

    test('listDatabases should return status 200', async () => {
        const result = await kwil.listDatabases(wallet.address);
        expect(result.status).toBe(200);
    })    

    test('ping should return status 200', async () => {
        const result = await kwil.ping();
        expect(result.status).toBe(200);
    })

    test('select should return status 200', async () => {
        const result = await kwil.selectQuery("xca20642aa31af7db6b43755cf40be91c51a157e447e6cc36c1d94f0a", "SELECT * FROM posts LIMIT 5");
        expect(result.status).toBe(200);
    });
});

// Funder methods that should be used
describe("Funder", () => {
    let funder: Funder;

    beforeAll(async () => {
        funder = await kwil.getFunder(wallet);
    });

    test('kwil.getFunder should return a funder', () => {
        expect(funder).toBeDefined();
        expect(funder).toMatchObject<FunderObj>({
            poolAddress: expect.any(String),
            signer: expect.any(Wallet),
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
    });

    test('getBalance should return balanceRes', async () => {
        const result = await funder.getBalance(wallet.address);
        expect(result).toBeDefined();
        expect(result).toMatchObject<BalanceRes>({
            balance: expect.any(String),
        })

        console.log(result)
    });

    test('approve should return a transaction', async () => {
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

    }, 30000);

    test('deposit should return a transaction', async () => {
        const result = await funder.deposit(100);
        expect(result).toBeDefined();
        expect(result).toMatchObject({
            to: expect.any(String),
            from: expect.any(String),
            value: expect.any(BigInt),
            chainId: expect.any(BigInt),
        });
    });

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
});


// Testing all methods to be called on action and in relation to action (e.g. kwil.getAction & kwil.broadcast)
describe("Action", () => {
    let action: Action;
    let recordCount: number;
    let actionTx: Transaction;

    beforeAll(async () => {
        action = await kwil.getAction("xca20642aa31af7db6b43755cf40be91c51a157e447e6cc36c1d94f0a", "add_post");
        const count = await kwil.selectQuery("xca20642aa31af7db6b43755cf40be91c51a157e447e6cc36c1d94f0a", "SELECT COUNT(*) FROM posts");
        if (count.status == 200 && count.data) {
            const amnt = count.data[0] as AmntObject;
            recordCount = amnt['COUNT(*)'];
        }
    });

    test('getAction should return an action', () => {
        expect(action).toBeDefined();
        expect(action).toMatchObject<ActionObj>({
            dbid: expect.any(String),
            name: expect.any(String),
            inputs: expect.any(Array),
        })
    });


    let actionInstance: AnyMap<any>;
    
    test('newInstance should return type AnyMap', () => {
        const result = action.newInstance();
        actionInstance = result;
        expect(result).toBeDefined();
        expect(result).toBeInstanceOf(AnyMap);
    });
    
    test('isComplete on newInstance should return true', () => {
        actionInstance.set("$id", recordCount + 1);
        actionInstance.set("$user", "Luke");
        actionInstance.set("$title", "Test Post");
        actionInstance.set("$body", "This is a test post");

        const result = action.isComplete();
        expect(result).toBe(true);
    })

    test('isComplete on bulk should return true', () => {
        const act = action.bulk([{
            "$id": recordCount + 2,
            "$user": "Luke",
            "$title": "Test Post",
            "$body": "This is a test post"
        },
        {
            "$id": recordCount + 3,
            "$user": "Luke",
            "$title": "Test Post",
            "$body": "This is a test post"
        }])
        const result = action.isComplete();
        expect(result).toBe(true);
    });

    test('prepareAction should return a transaction', async () => {
        const result = await action.prepareAction(wallet);
        actionTx = result;
        expect(result).toBeDefined();
        expect(result).toBeInstanceOf(Transaction);
    });

    test('the action should be able to be broadcasted and return a txHash and a txReceipt', async () => {
        const result = await kwil.broadcast(actionTx);
        expect(result.data).toBeDefined();
        expect(result.data).toMatchObject<TxReceipt>({
            txHash: expect.any(String),
            fee: expect.any(String),
        });
    });
});

// Testing all methods to be called on DBBuilder and in relation to DBBuilder (e.g. kwil.newDatabase & kwil.broadcast)
describe("DBBuilder", () => {
    let db: schemaObj = schema;
    let newDb: DBBuilder;
    let dbTx: Transaction;
    

    beforeAll(async () => {
        const dbAmount = await kwil.listDatabases(wallet.address);
        const count = dbAmount.data as string[];
        db.name = `test_db_${count.length + 1}`;
        console.log(db)
    });

    test('newDatabase should return a DBBuilder', () => {
        newDb= kwil.newDatabase(db);
        expect(newDb).toBeDefined();
        expect(newDb).toBeInstanceOf(DBBuilder);
    });

    test('prepareJson should return a signed transaction', async () => {
        dbTx = await newDb.prepareJson(wallet);
        expect(dbTx).toBeDefined();
        expect(dbTx).toBeInstanceOf(Transaction);
        expect(dbTx.tx.signature.signature_bytes).toBeDefined();
    });

    test('the database should be able to be broadcasted and return a txHash and a txReceipt', async () => {
        const result = await kwil.broadcast(dbTx);
        expect(result.data).toBeDefined();
        expect(result.data).toMatchObject<TxReceipt>({
            txHash: expect.any(String),
            fee: expect.any(String),
        });
    });
});


// estimateCost should not be used by end user