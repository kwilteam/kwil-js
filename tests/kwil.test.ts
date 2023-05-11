import {AmntObject, kwil, wallet} from "./testingUtils";
import {Transaction} from "../dist/core/tx";
import {ActionBuilder} from "../dist/core/builders";
import {ActionBuilderImpl} from "../dist/builders/action_builder";
import {Action} from "../dist/core/action";

// Kwil methods that do NOT return another class (e.g. funder, action, and DBBuilder)
// describe("Kwil", () => {
//     test('getDBID should return the correct value', () => {
//         const result = kwil.getDBID(wallet.address, "mydb");
//         expect(result).toBe("xca20642aa31af7db6b43755cf40be91c51a157e447e6cc36c1d94f0a");
//     });

//     test('getSchema should return status 200', async () => {
//         const result = await kwil.getSchema("xca20642aa31af7db6b43755cf40be91c51a157e447e6cc36c1d94f0a");
//         expect(result.status).toBe(200);
//     })

//     test('getAccount should return status 200', async () => {
//         const result = await kwil.getAccount(wallet.address);
//         expect(result.status).toBe(200);
//     })

//     test('listDatabases should return status 200', async () => {
//         const result = await kwil.listDatabases(wallet.address);
//         expect(result.status).toBe(200);
//     })    

//     test('ping should return status 200', async () => {
//         const result = await kwil.ping();
//         expect(result.status).toBe(200);
//     })

//     test('select should return status 200', async () => {
//         const result = await kwil.selectQuery("xca20642aa31af7db6b43755cf40be91c51a157e447e6cc36c1d94f0a", "SELECT * FROM posts LIMIT 5");
//         expect(result.status).toBe(200);
//     });
// });

// // Funder methods that should be used
// describe("Funder", () => {
//     let funder: Funder;

//     beforeAll(async () => {
//         funder = await kwil.getFunder(wallet);
//     });

//     test('kwil.getFunder should return a funder', () => {
//         expect(funder).toBeDefined();
//         expect(funder).toMatchObject<FunderObj>({
//             poolAddress: expect.any(String),
//             signer: expect.any(Wallet),
//             providerAddress: expect.any(String),
//             escrowContract: expect.any(Object),
//             erc20Contract: expect.any(Object),
//         })
//     });

//     test('getAllowance should return allowanceRes', async () => {
//         const result = await funder.getAllowance(wallet.address);
//         expect(result).toBeDefined();
//         expect(result).toMatchObject<AllowanceRes>({
//             allowance_balance: expect.any(String),
//         })
//     });

//     test('getBalance should return balanceRes', async () => {
//         const result = await funder.getBalance(wallet.address);
//         expect(result).toBeDefined();
//         expect(result).toMatchObject<BalanceRes>({
//             balance: expect.any(String),
//         })

//         console.log(result)
//     });

//     test('approve should return a transaction', async () => {
//         const funder = await kwil.getFunder(wallet);
//         const result = await funder.approve(100) as ContractTransactionResponse;
//         expect(result).toBeDefined();
//         expect(result).toMatchObject({
//             to: expect.any(String),
//             from: expect.any(String),
//             value: expect.any(BigInt),
//             chainId: expect.any(BigInt),
//         });

//         const hash = result.hash;

//         console.log("Waiting for confirmations...")
//         await waitForConfirmations(hash, 1);

//     }, 40000);

//     test('deposit should return a transaction', async () => {
//         const result = await funder.deposit(100);
//         expect(result).toBeDefined();
//         expect(result).toMatchObject({
//             to: expect.any(String),
//             from: expect.any(String),
//             value: expect.any(BigInt),
//             chainId: expect.any(BigInt),
//         });
//     });

//     test('getDepositedBalance should return a balance', async () => {
//         const result = await funder.getDepositedBalance(wallet.address);
//         expect(result).toBeDefined();
//         expect(result).toMatchObject<DepositRes>({
//             deposited_balance: expect.any(String),
//         })
//     });

//     test('getTokenAddress should return a token address', async () => {
//         const result = await funder.getTokenAddress();
//         expect(result).toBeDefined();
//         expect(result).toMatchObject<TokenRes>({
//             token_address: expect.any(String),
//         })
//     });
// });

// Testing all methods to be called on action and in relation to action (e.g. kwil.getAction & kwil.broadcast)
describe("ActionBuilder", () => {
    let actionBuilder: ActionBuilder;
    let recordCount: number;
    let actionTx: Transaction;

    beforeAll(async () => {
        actionBuilder = kwil
            .actionBuilder()
            .dbid("xca20642aa31af7db6b43755cf40be91c51a157e447e6cc36c1d94f0a")
            .name("add_post");

        const count = await kwil.selectQuery("xca20642aa31af7db6b43755cf40be91c51a157e447e6cc36c1d94f0a", "SELECT COUNT(*) FROM posts");
        if (count.status == 200 && count.data) {
            const amnt = count.data[0] as AmntObject;
            recordCount = amnt['COUNT(*)'];
        }
    });

    test('actionBuilder() should return an actionBuilder', () => {
        expect(actionBuilder).toBeDefined();
        expect(actionBuilder).toBeInstanceOf(ActionBuilderImpl);
    });

    test('prepareAction should return a transaction', async () => {
        const values = [{
            "$id": recordCount + 2,
            "$user": "Luke",
            "$title": "Test Post",
            "$body": "This is a test post"
        }, {
            "$id": recordCount + 3,
            "$user": "Luke",
            "$title": "Test Post",
            "$body": "This is a test post"
        }];

        const multi = Action.fromObjects(values);

        const solo = Action.of()
            .put("$id", recordCount + 1)
            .put("$user", "Luke")
            .put("$title", "Test Post")
            .put("$body", "This is a test post");

        actionTx = await actionBuilder
            .concat(solo)
            .concat(... multi)
            .signer(wallet)
            .buildTx();

        expect(actionTx).toBeInstanceOf(Transaction);
    });

    // test('the action should be able to be broadcasted and return a txHash and a txReceipt', async () => {
    //     const result = await kwil.broadcast(actionTx);
    //     expect(result.data).toBeDefined();
    //     expect(result.data).toMatchObject<TxReceipt>({
    //         txHash: expect.any(String),
    //         fee: expect.any(String),
    //         body: expect.any(String),
    //     });
    // });
});

// Testing all methods to be called on DBBuilder and in relation to DBBuilder (e.g. kwil.newDatabase & kwil.broadcast)
// describe("DBBuilder", () => {
//     let db: schemaObj = schema;
//     let newDb: DBBuilder;
//     let dbTx: Transaction;

//     beforeAll(async () => {
//         const dbAmount = await kwil.listDatabases(wallet.address);
//         const count = dbAmount.data as string[];
//         db.name = `test_db_${count.length + 1}`;
//         console.log(db)
//     });

//     test('newDatabase should return a DBBuilder', () => {
//         newDb = kwil.dbBuilder();
//         expect(newDb).toBeDefined();
//         expect(newDb).toBeInstanceOf<DBBuilder>(newDb);
//     });

//     test('prepareJson should return a signed transaction', async () => {
//         dbTx = await newDb
//             .payload(db)
//             .signer(wallet)
//             .buildTx();
//         expect(dbTx).toBeDefined();
//         expect(dbTx).toBeInstanceOf<Transaction>(dbTx);
//         expect(dbTx.isSigned()).toBe(true);
//     });

//     test('the database should be able to be broadcasted and return a txHash and a txReceipt', async () => {
//         const result = await kwil.broadcast(dbTx);
//         expect(result.data).toBeDefined();
//         expect(result.data).toMatchObject<TxReceipt>({
//             txHash: expect.any(String),
//             fee: expect.any(String),
//             body: expect.any(String),
//         });
//     });
// });


// estimateCost should not be used by end user