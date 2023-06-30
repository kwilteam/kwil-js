import {AmntObject, dbid, kwil, wallet} from "./testingUtils";
import {Transaction, TxReceipt} from "../dist/core/tx";
import {ActionBuilder, DBBuilder} from "../dist/core/builders";
import {ActionBuilderImpl} from "../dist/builders/action_builder";
import { Funder } from "../dist/funder/funding";
import { FunderObj } from "./testingUtils";
import { ContractTransactionResponse, Wallet } from "ethers";
import { AllowanceRes, BalanceRes, DepositRes, TokenRes } from "../dist/funder/types";
import { waitForConfirmations } from "./testingUtils";
import { schemaObj } from "./testingUtils";
import schema from "./test_schema2.json";
import {DBBuilderImpl} from "../dist/builders/db_builder";
import {DropDBBuilderImpl} from "../dist/builders/drop_db_builder";
import { Types, Utils } from "../dist/index";

// Kwil methods that do NOT return another class (e.g. funder, action, and DBBuilder)
describe("Kwil", () => {
    test('getDBID should return the correct value', () => {
        const result = kwil.getDBID(wallet.address, "mydb");
        expect(result).toBe("xca20642aa31af7db6b43755cf40be91c51a157e447e6cc36c1d94f0a");
    });

    test('getSchema should return status 200', async () => {
        const result = await kwil.getSchema(dbid);
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
        const result = await kwil.selectQuery(dbid, "SELECT * FROM posts LIMIT 5");
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
});


// Testing all methods to be called on actionBuilder, actionInput, and the Transaction class and kwil.broadcast()
describe("ActionBuilder + ActionInput + Transaction public methods & broadcasting an action Transaction", () => {
    let actionBuilder: ActionBuilder;
    let recordCount: number;
    let actionInput: Types.ActionInput;
    let actionInputArr: Types.ActionInput[];

    beforeAll(async () => {
        actionBuilder = kwil
            .actionBuilder()
            .dbid(dbid)
            .name("add_post");

        const count = await kwil.selectQuery(dbid, "SELECT COUNT(*) FROM posts");
        if (count.status == 200 && count.data) {
            const amnt = count.data[0] as AmntObject;
            recordCount = amnt['COUNT(*)'];
        } 
        
        actionInput = new Utils.ActionInput();
    });

    test('actionBuilder() should return an actionBuilder', () => {
        expect(actionBuilder).toBeDefined();
        expect(actionBuilder).toBeInstanceOf(ActionBuilderImpl);
        expect(actionBuilder).toBeDefined();
        expect(actionBuilder).toBeInstanceOf(ActionBuilderImpl);
    });

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
    });

    test('actionInput.putIfAbsent should add the missing $body input', () => {
        actionInput.putIfAbsent("$toBeDeleted", "This is a test post to be deleted.");

        expect(actionInput).toBeDefined();
        expect(actionInput.get("$id")).toBe(recordCount + 1);
        expect(actionInput.get("$user")).toBe("Luke");
        expect(actionInput.get("$title")).toBe("Test Post");
        expect(actionInput.get("$body")).toBe("This is a test post");
        expect(actionInput.get("$toBeDeleted")).toBe("This is a test post to be deleted.");
    });

    test("actionInput.putIfAbsent should not overwrite existing inputs", () => {
        actionInput.putIfAbsent("$toBeDeleted", "This is a test post that should not be written.");

        expect(actionInput).toBeDefined();
        expect(actionInput.get("$id")).toBe(recordCount + 1);
        expect(actionInput.get("$user")).toBe("Luke");
        expect(actionInput.get("$title")).toBe("Test Post");
        expect(actionInput.get("$body")).toBe("This is a test post");
        expect(actionInput.get("$toBeDeleted")).toBe("This is a test post to be deleted.");
    });

    test("actionInput.replace should replace a field", () => {
        actionInput.replace("$toBeDeleted", "This is a test post that should be replaced and later deleted.");

        expect(actionInput).toBeDefined();
        expect(actionInput.get("$id")).toBe(recordCount + 1);
        expect(actionInput.get("$user")).toBe("Luke");
        expect(actionInput.get("$title")).toBe("Test Post");
        expect(actionInput.get("$body")).toBe("This is a test post");
        expect(actionInput.get("$toBeDeleted")).toBe("This is a test post that should be replaced and later deleted.");
    })

    test("actionInput.replace should not replace a field that does not exist", () => {
        actionInput.replace("$noExists", "This is a test post that should not be included.");

        expect(actionInput).toBeDefined();
        expect(actionInput.get("$id")).toBe(recordCount + 1);
        expect(actionInput.get("$user")).toBe("Luke");
        expect(actionInput.get("$title")).toBe("Test Post");
        expect(actionInput.get("$body")).toBe("This is a test post");
        expect(actionInput.get("$toBeDeleted")).toBe("This is a test post that should be replaced and later deleted.");
        expect(actionInput.get("$noExists")).toBeUndefined();
    })

    test("actionInput.getOrDefault should return the value of an existing field", () => {
        const result = actionInput.getOrDefault("$body", "This is the default value");
        expect(result).toBe("This is a test post");
    });

    test("actionInput.getOrDefault should return the default value of a non-existing field", () => {
        const result = actionInput.getOrDefault("$noExists", "This is the default value");
        expect(result).toBe("This is the default value");
    });

    test("actionInput.containsKey should return true for a property in the actionInput", () => {
        const result = actionInput.containsKey("$id");
        expect(result).toBe(true);
    })

    test("actionInput.containsKey should return false for a property not in the actionInput", () => {
        const result = actionInput.containsKey("$noExists");
        expect(result).toBe(false);
    });

    test("actionInput.remove should remove a property from the actionInput", () => {
        actionInput.remove("$toBeDeleted");
        expect(actionInput.containsKey("$toBeDeleted")).toBe(false);
        expect(actionInput.get("$toBeDeleted")).toBeUndefined();
    });

    test("actionInput.toArray should return an array of entries", () => {
        const result = actionInput.toArray();
        expect(result).toBeDefined();
        expect(result).toBeInstanceOf(Array);
        expect(result).toHaveLength(4);
        expect(result).toMatchObject([
            ["$id", recordCount + 1],
            ["$user", "Luke"],
            ["$title", "Test Post"],
            ["$body", "This is a test post"],
        ]);
    });

    test("actionInput should be iterable", () => {
        let count = 0;
        for (const entry of actionInput) {
            expect(entry).toBeDefined();
            expect(entry).toBeInstanceOf(Array);
            expect(entry).toHaveLength(2);
            count++;
        }

        expect(count).toBe(4);
    });

    test("actionInput.putFromObject should add all properties from an object", () => {
        actionInput.remove("$id");
        actionInput.remove("$user");
        actionInput.remove("$title");
        actionInput.remove("$body");

        //check that actionInput is empty
        expect(actionInput.get("$id")).toBeUndefined();
        expect(actionInput.get("$user")).toBeUndefined();
        expect(actionInput.get("$title")).toBeUndefined();
        expect(actionInput.get("$body")).toBeUndefined();

        //create obj
        const obj = {
            "$id": `${recordCount + 1} will be replaced`,
            "$user": "Luke will be replaced",
            "$title": "Test Post will be replaced",
        };

        actionInput.putFromObject(obj);

        expect(actionInput).toBeDefined();
        expect(actionInput.get("$id")).toBe(`${recordCount + 1} will be replaced`);
        expect(actionInput.get("$user")).toBe("Luke will be replaced");
        expect(actionInput.get("$title")).toBe("Test Post will be replaced");
    });

    test("actionInput.putFromObjectIfAbsent should add all properties from an object if they do not exist", () => {
        const obj = {
            "$id": "This should not be entered",
            "$user": "This should not be entered",
            "$title": "This should not be entered",
            "$body": "This is a test post will be replaced",
        }

        actionInput.putFromObjectIfAbsent(obj);

        expect(actionInput).toBeDefined();
        expect(actionInput.get("$id")).toBe(`${recordCount + 1} will be replaced`);
        expect(actionInput.get("$user")).toBe("Luke will be replaced");
        expect(actionInput.get("$title")).toBe("Test Post will be replaced");
        expect(actionInput.get("$body")).toBe("This is a test post will be replaced");
    });

    test("actionInput.replaceFromObject", () => {
        const obj = {
            "$id": recordCount + 1,
            "$user": "Luke",
            "$title": "Test Post",
            "$body": "This is a test post",
        }

        actionInput.replaceFromObject(obj);

        expect(actionInput).toBeDefined();
        expect(actionInput.get("$id")).toBe(recordCount + 1);
        expect(actionInput.get("$user")).toBe("Luke");
        expect(actionInput.get("$title")).toBe("Test Post");
        expect(actionInput.get("$body")).toBe("This is a test post");
    });

    test("actionInput.putFromObjects should return an array of ActionInputs", () => {
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

        actionInputArr = actionInput.putFromObjects(values);

        expect(actionInputArr).toBeDefined();
        expect(actionInputArr).toBeInstanceOf(Array);
        expect(actionInputArr).toHaveLength(2);
        expect(actionInputArr[0]).toBeInstanceOf(Utils.ActionInput);
        expect(actionInputArr[0].get("$id")).toBe(recordCount + 2);
        expect(actionInputArr[0].get("$user")).toBe("Luke");
        expect(actionInputArr[0].get("$title")).toBe("Test Post");
        expect(actionInputArr[0].get("$body")).toBe("This is a test post");
        expect(actionInputArr[1]).toBeInstanceOf(Utils.ActionInput);
        expect(actionInputArr[1].get("$id")).toBe(recordCount + 3);
        expect(actionInputArr[1].get("$user")).toBe("Luke");
        expect(actionInputArr[1].get("$title")).toBe("Test Post");
        expect(actionInputArr[1].get("$body")).toBe("This is a test post");
    });

    let staticActionInputFrom: Types.ActionInput;
    
    test("The static actionInput.from() method should accept an array of key value pairs and return an action", () => {
        staticActionInputFrom = Utils.ActionInput.from([
            ["$id", recordCount + 4],
            ["$user", "Luke"],
            ["$title", "Test Post"],
            ["$body", "This is a test post"],
        ]);

        expect(staticActionInputFrom).toBeDefined();
        expect(staticActionInputFrom).toBeInstanceOf(Utils.ActionInput);
        expect(staticActionInputFrom.get("$id")).toBe(recordCount + 4);
        expect(staticActionInputFrom.get("$user")).toBe("Luke");
        expect(staticActionInputFrom.get("$title")).toBe("Test Post");
        expect(staticActionInputFrom.get("$body")).toBe("This is a test post");
    })

    let staticActionInputFromObject: Types.ActionInput;

    test("The static actionInput.fromObject() method should accept an object and return an action", () => {
        const obj = {
            "$id": recordCount + 5,
            "$user": "Luke",
            "$title": "Test Post",
            "$body": "This is a test post",
        }

        staticActionInputFromObject = Utils.ActionInput.fromObject(obj);

        expect(staticActionInputFromObject).toBeDefined();
        expect(staticActionInputFromObject).toBeInstanceOf(Utils.ActionInput);
        expect(staticActionInputFromObject.get("$id")).toBe(recordCount + 5);
        expect(staticActionInputFromObject.get("$user")).toBe("Luke");
        expect(staticActionInputFromObject.get("$title")).toBe("Test Post");
        expect(staticActionInputFromObject.get("$body")).toBe("This is a test post");
    });

    let staticActionInputFromObjects: Types.ActionInput[];

    test("The static actionInput.fromObjects() method should accept an array of objects and return an array of actions", () => {
        const objs = [{
            "$id": recordCount + 6,
            "$user": "Luke",
            "$title": "Test Post",
            "$body": "This is a test post"
        }, {
            "$id": recordCount + 7,
            "$user": "Luke",
            "$title": "Test Post",
            "$body": "This is a test post"
        }];

        staticActionInputFromObjects = Utils.ActionInput.fromObjects(objs);

        expect(staticActionInputFromObjects).toBeDefined();
        expect(staticActionInputFromObjects).toBeInstanceOf(Array);
        expect(staticActionInputFromObjects).toHaveLength(2);
        expect(staticActionInputFromObjects[0]).toBeInstanceOf(Utils.ActionInput);
        expect(staticActionInputFromObjects[0].get("$id")).toBe(recordCount + 6);
        expect(staticActionInputFromObjects[0].get("$user")).toBe("Luke");
        expect(staticActionInputFromObjects[0].get("$title")).toBe("Test Post");
        expect(staticActionInputFromObjects[0].get("$body")).toBe("This is a test post");
        expect(staticActionInputFromObjects[1]).toBeInstanceOf(Utils.ActionInput);
        expect(staticActionInputFromObjects[1].get("$id")).toBe(recordCount + 7);
        expect(staticActionInputFromObjects[1].get("$user")).toBe("Luke");
        expect(staticActionInputFromObjects[1].get("$title")).toBe("Test Post");
        expect(staticActionInputFromObjects[1].get("$body")).toBe("This is a test post");
    });

    test("The static actionInput.of() method should return an empty action", () => {
        const result = Utils.ActionInput.of();

        expect(result).toBeDefined();
        expect(result).toBeInstanceOf(Utils.ActionInput);
        expect(result.get("$id")).toBeUndefined();
        expect(result.get("$user")).toBeUndefined();
        expect(result.get("$title")).toBeUndefined();
        expect(result.get("$body")).toBeUndefined();
    });

    let staticActionInputOf: Types.ActionInput;
    test("The static actionInput.of() method should return an action with the given inputs", () => {
        staticActionInputOf = Utils.ActionInput.of()
            .put("$id", recordCount + 8)
            .put("$user", "Luke")
            .put("$title", "Test Post")
            .put("$body", "This is a test post");

        expect(staticActionInputOf).toBeDefined();
        expect(staticActionInputOf).toBeInstanceOf(Utils.ActionInput);
        expect(staticActionInputOf.get("$id")).toBe(recordCount + 8);
        expect(staticActionInputOf.get("$user")).toBe("Luke");
        expect(staticActionInputOf.get("$title")).toBe("Test Post");
        expect(staticActionInputOf.get("$body")).toBe("This is a test post");
    });

    test("The actionBuilder.concat() method should return an actionBuilder with the given inputs", () => {
        const result = actionBuilder
            .concat(actionInput)
            .concat(actionInputArr)
            .concat(staticActionInputFrom)
            .concat(staticActionInputFromObject)
            .concat(staticActionInputFromObjects)
            .concat(staticActionInputOf);

        expect(result).toBeDefined();
        expect(result).toBeInstanceOf(ActionBuilderImpl);
        expect(result).toBe(actionBuilder);
        expect(result).not.toBe(staticActionInputOf);
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

// Testing all methods to be called on DBBuilder and in relation to DBBuilder (e.g. kwil.newDatabase & kwil.broadcast)
describe("DBBuilder", () => {
    let db: schemaObj = schema;
    let newDb: DBBuilder;

    beforeAll(async () => {
        const dbAmount = await kwil.listDatabases(wallet.address);
        const count = dbAmount.data as string[];
        db.name = `test_db_${count.length + 1}`;
    });

    test('newDatabase should return a DBBuilder', () => {
        newDb = kwil.dbBuilder();
        expect(newDb).toBeDefined();
        expect(newDb).toBeInstanceOf(DBBuilderImpl);
    });

    test("DBBuilderImpl.signer() should return a DBBuilder", () => {
        newDb = newDb.signer(wallet);

        expect(newDb).toBeDefined();
        expect(newDb).toBeInstanceOf(DBBuilderImpl);
    });

    test("DBBuilderImpl.payload() should return a DBBuilder", () => {
        let readyDb = db;
        db.owner = wallet.address;
        
        newDb = newDb.payload(readyDb);

        expect(newDb).toBeDefined();
        expect(newDb).toBeInstanceOf(DBBuilderImpl);
    });

    let dbTx: Transaction;

    test('buildTx should return a signed transaction', async () => {
        dbTx = await newDb
            .buildTx();
        expect(dbTx).toBeDefined();
        expect(dbTx).toBeInstanceOf(Transaction);
        expect(dbTx.isSigned()).toBe(true);
    });

    test("All methods and getters on the Transaction class should return the correct values", () => {
        expect(dbTx).toBeDefined();
        expect(dbTx).toBeInstanceOf(Transaction);
        expect(dbTx.isSigned()).toBe(true);
        expect(dbTx.hash).toBeDefined();
        expect(dbTx.payload_type).toBeDefined();
        expect(dbTx.payload).toBeDefined();
        expect(dbTx.fee).toBeDefined();
        expect(dbTx.fee).not.toBe("0");
        expect(dbTx.nonce).toBeGreaterThan(-1);
        expect(dbTx.signature).toBeDefined();
        expect(dbTx.signature.signature_bytes).toBeDefined();
        expect(dbTx.signature.signature_bytes).not.toHaveLength(0);
        expect(dbTx.signature.signature_type).toBeDefined();
    });

    test('the database should be able to be broadcasted and return a txHash and a txReceipt', async () => {
        const result = await kwil.broadcast(dbTx);
        expect(result.data).toBeDefined();
        expect(result.data).toMatchObject<TxReceipt>({
            txHash: expect.any(String),
            fee: expect.any(String),
            body: null,
        });
    });
});

// Testing all methods on Drop Database
describe("Drop Database", () => {
    let payload = {
        owner: "",
        name: ""
    }
    let dropDb: DBBuilder;

    beforeAll(async () => {
        // retrieve latest database name
        const dbAmount = await kwil.listDatabases(wallet.address);
        const count = dbAmount.data as string[];
        payload.name = `test_db_${count.length}`;
    });

    test('kwil.dropDatabase should return a DBBuilder', () => {
        dropDb = kwil.dropDBBuilder();
        expect(dropDb).toBeDefined();
        expect(dropDb).toBeInstanceOf(DropDBBuilderImpl);
    })

    test("DBBuilderImpl.signer() should return a DBBuilder", () => {
        dropDb = dropDb.signer(wallet);

        expect(dropDb).toBeDefined();
        expect(dropDb).toBeInstanceOf(DropDBBuilderImpl);
    });

    test("DBBuilderImpl.payload() should return a DBBuilder", () => {
        payload.owner = wallet.address;
        dropDb = dropDb.payload(payload);

        expect(dropDb).toBeDefined();
        expect(dropDb).toBeInstanceOf(DropDBBuilderImpl);
    });

    let dropDbTx: Transaction;

    test('buildTx should return a signed transaction', async () => {
        dropDbTx = await dropDb
            .buildTx();
        expect(dropDbTx).toBeDefined();
        expect(dropDbTx).toBeInstanceOf(Transaction);
        expect(dropDbTx.isSigned()).toBe(true);
    });

    test("All methods and getters on the Transaction class should return the correct values", () => {
        expect(dropDbTx).toBeDefined();
        expect(dropDbTx).toBeInstanceOf(Transaction);
        expect(dropDbTx.isSigned()).toBe(true);
        expect(dropDbTx.hash).toBeDefined();
        expect(dropDbTx.payload_type).toBeDefined();
        expect(dropDbTx.payload).toBeDefined();
        expect(dropDbTx.fee).toBeDefined();
        expect(dropDbTx.fee).not.toBe("0");
        expect(dropDbTx.nonce).toBeGreaterThan(-1);
        expect(dropDbTx.signature).toBeDefined();
        expect(dropDbTx.signature.signature_bytes).toBeDefined();
        expect(dropDbTx.signature.signature_bytes).not.toHaveLength(0);
        expect(dropDbTx.signature.signature_type).toBeDefined();
    });

    test('the database should be able to be broadcasted and return a txHash and a txReceipt', async () => {
        const result = await kwil.broadcast(dropDbTx);
        expect(result.data).toBeDefined();
        expect(result.data).toMatchObject<TxReceipt>({
            txHash: expect.any(String),
            fee: expect.any(String),
            body: null,
        });
    });

    test('the database should be dropped', async () => {
        const result = await kwil.listDatabases(wallet.address);
        console.log(result)
        console.log(payload.name)
        expect(result.data).toBeDefined();
        expect(result.data).not.toContain(payload.name);
    });
});