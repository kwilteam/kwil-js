const originalLog = console.log;
const logSpy = jest.spyOn(console, 'log').mockImplementation((...args) => {
    originalLog(...args);
});
jest.resetModules();
import {AmntObject, dbid, kwil, waitForDeployment, wallet} from "./testingUtils";
import {DropDbPayload, Transaction, TxReceipt} from "../dist/core/tx";
import {ActionBuilder, DBBuilder} from "../dist/core/builders";
import {ActionBuilderImpl} from "../dist/builders/action_builder";
import { schemaObj } from "./testingUtils";
import schema from "./test_schema2.json";
import {DBBuilderImpl} from "../dist/builders/db_builder";
import {DropDBBuilderImpl} from "../dist/builders/drop_db_builder";
import { Types, Utils } from "../dist/index";
import { Message, MsgReceipt } from "../dist/core/message";

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Kwil methods that do NOT return another class (e.g. funder, action, and DBBuilder)
describe("Kwil", () => {

    afterEach(() => {
        logSpy.mockClear();
      });
    
      afterAll(() => {
        logSpy.mockRestore();
      });
  
    test('getDBID should return the correct value', () => {
        const result = kwil.getDBID(wallet.address, "mydb");
        expect(result).toBe("xca20642aa31af7db6b43755cf40be91c51a157e447e6cc36c1d94f0a");
        // when on public network, change to: xca20642aa31af7db6b43755cf40be91c51a157e447e6cc36c1d94f0a
        // when on local network, change to: xcdd04ff7c5e4a939d5365ec9b54cc4aab8c610c415f5f9b33323ae77
    });

    let schema: any;

    test('getSchema should return status 200', async () => {
        const result = await kwil.getSchema(dbid);
        schema = result.data;
        expect(result.status).toBe(200);
    })

    test('getSchema result should be cached properly', async () => {
        jest.useFakeTimers();

        const result = await kwil.getSchema(dbid);
        expect(result.status).toBe(200);
        expect(result.data).toStrictEqual(schema);

        // Simulate the passage of 11 minutes
        jest.advanceTimersByTime(11 * 60 * 1000);

        const result2 = await kwil.getSchema(dbid);

        expect(result2.status).toBe(200);
        expect(result2.data).toBeDefined();

        // each server requests make two console logs. If the cache expired properly, it should make a new request.
        expect(logSpy).toHaveBeenCalledTimes(2)
    
        // Reset the mock to ensure it doesn't affect other tests
        jest.resetAllMocks();
        jest.useRealTimers();
    });
    
    
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
        expect(actionTx.signature).toBeDefined();
        expect(actionTx.signature.signature_bytes).toBeDefined();
        expect(actionTx.signature.signature_bytes).not.toHaveLength(0);
        expect(actionTx.signature.signature_type).toBeDefined();
        expect(actionTx.body).toBeDefined();
        expect(actionTx.body.fee).toBeDefined();
        expect(actionTx.body.payload).toBeDefined();
        expect(actionTx.body.payload_type).toBeDefined();
        expect(actionTx.body.nonce).toBeGreaterThan(0);
        expect(actionTx.body.salt).toBeDefined();
        expect(actionTx.body.salt.length).toBeGreaterThan(0);
        expect(actionTx.sender).toBeDefined();
    });

    test("The kwil.broadcast() method should accept a transaction and return a txHash and a txReceipt", async () => {
        const result = await kwil.broadcast(actionTx);
        expect(result.data).toBeDefined();
        expect(result.data).toMatchObject<TxReceipt>({
            txHash: expect.any(String),
        });
    });
});

let txHash: string;

// Testing all methods to be called on DBBuilder and in relation to DBBuilder (e.g. kwil.newDatabase & kwil.broadcast)
describe("DBBuilder", () => {
    let db: schemaObj = schema;
    let newDb: DBBuilder;

    beforeEach(async () => await sleep(500))

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
        expect(dbTx.signature).toBeDefined();
        expect(dbTx.signature.signature_bytes).toBeDefined();
        expect(dbTx.signature.signature_bytes).not.toHaveLength(0);
        expect(dbTx.signature.signature_type).toBeDefined();
        expect(dbTx.body).toBeDefined();
        expect(dbTx.body.fee).toBeDefined();
        expect(dbTx.body.payload).toBeDefined();
        expect(dbTx.body.payload_type).toBeDefined();
        expect(dbTx.body.nonce).toBeGreaterThan(0);
        expect(dbTx.body.salt).toBeDefined();
        expect(dbTx.body.salt.length).toBeGreaterThan(0);
        expect(dbTx.sender).toBeDefined();
    });

    test('the database should be able to be broadcasted and return a txHash and a txReceipt', async () => {
        const result = await kwil.broadcast(dbTx);
        expect(result.data).toBeDefined();
        expect(result.data).toMatchObject<TxReceipt>({
            txHash: expect.any(String),
        });

        if(result.data) {
            txHash = result.data.txHash;
        }
    });
});

describe("Testing case insentivity on test_db", () => {
    let dbName: string;
    let dbid: string;

    beforeEach(async () => await sleep(1000))

    const actionInputs = Utils.ActionInput.of()
        .put("$id", 1)
        .put("$username", "Luke")
        .put("$age", 25)

    beforeAll(async () => {
        const dbAmount = await kwil.listDatabases(wallet.address);
        const count = dbAmount.data as string[];
        dbName = `test_db_${count.length}`;
        dbid = kwil.getDBID(wallet.address, dbName);
        console.log('TXHASH', txHash)
        await waitForDeployment(txHash);
    }, 10000);

    test("createUserTest action should execute", async () => {
        const tx = await kwil
            .actionBuilder()
            .dbid(dbid)
            .name("createUserTest")
            .signer(wallet)
            .concat(actionInputs)
            .buildTx();

        const result = await kwil.broadcast(tx);

        expect(result.data).toBeDefined();
        expect(result.data).toMatchObject<TxReceipt>({
            txHash: expect.any(String),
        });
    });

    test("delete_user action should execute", async () => {
        const tx = await kwil
            .actionBuilder()
            .dbid(dbid)
            .name("delete_user")
            .signer(wallet)
            .buildTx();

        const result = await kwil.broadcast(tx);

        expect(result.data).toBeDefined();
        expect(result.data).toMatchObject<TxReceipt>({
            txHash: expect.any(String),
        });
    });

    test('CREATEUSERTEST action should execute', async () => {
        const tx = await kwil
            .actionBuilder()
            .dbid(dbid)
            .name("CREATEUSERTEST")
            .signer(wallet)
            .concat(actionInputs)
            .buildTx();

        const result = await kwil.broadcast(tx);

        expect(result.data).toBeDefined();
        expect(result.data).toMatchObject<TxReceipt>({
            txHash: expect.any(String),
        });
    });

    test('DELETE_USER action should execute', async () => {
        const tx = await kwil
            .actionBuilder()
            .dbid(dbid)
            .name("DELETE_USER")
            .signer(wallet)
            .buildTx();

        const result = await kwil.broadcast(tx);

        expect(result.data).toBeDefined();
        expect(result.data).toMatchObject<TxReceipt>({
            txHash: expect.any(String),
        });
    });

    test('createusertest action should execute', async () => {
        const tx = await kwil
            .actionBuilder()
            .dbid(dbid)
            .name("createusertest")
            .signer(wallet)
            .concat(actionInputs)
            .buildTx();

        const result = await kwil.broadcast(tx);

        expect(result.data).toBeDefined();
        expect(result.data).toMatchObject<TxReceipt>({
            txHash: expect.any(String),
        });
    });
})

// Testing ActionBuilder to a Message and the kwil.call() api
describe("ActionBuilder to Message", () => {
    let actionBuilder: ActionBuilder;

    beforeAll(() => {
        actionBuilder = kwil
            .actionBuilder()
            .dbid(dbid)
            .name("read_posts");
    })

    let message: Message;

    test("The actionBuilder.buildMessage() method should return a message", async () => {
        message = await actionBuilder.buildMsg();
        expect(message).toBeDefined();
        expect(message).toBeInstanceOf(Message);
    });

    test('kwil.call() should return a MsgReceipt', async () => {
        const result = await kwil.call(message);
        expect(result.data).toBeDefined();
        expect(result.data).toMatchObject<MsgReceipt>({
            result: expect.any(Array),
        });
    });
});

// Testing all methods on Drop Database
describe("Drop Database", () => {
    let payload: DropDbPayload = {
        dbid: ''
    }
    let dropDb: DBBuilder;
    let dbName: string;

    beforeEach(async () => await sleep(500))

    beforeAll(async () => {
        // retrieve latest database name
        const dbAmount = await kwil.listDatabases(wallet.address);
        const count = dbAmount.data as string[];
        dbName = `test_DB_${count.length}`;
        const dbid = kwil.getDBID(wallet.address, dbName);
        payload.dbid = dbid; 
    });

    test('kwil.dropDatabase should return a DBBuilder', () => {
        dropDb = kwil.dropDbBuilder();
        expect(dropDb).toBeDefined();
        expect(dropDb).toBeInstanceOf(DBBuilderImpl);
    })

    test("DBBuilderImpl.signer() should return a DBBuilder", () => {
        dropDb = dropDb.signer(wallet);

        expect(dropDb).toBeDefined();
        expect(dropDb).toBeInstanceOf(DBBuilderImpl);
    });

    test("DBBuilderImpl.payload() should return a DBBuilder", () => {
        dropDb = dropDb.payload(payload);

        expect(dropDb).toBeDefined();
        expect(dropDb).toBeInstanceOf(DBBuilderImpl);
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
        expect(dropDbTx.signature).toBeDefined();
        expect(dropDbTx.signature.signature_bytes).toBeDefined();
        expect(dropDbTx.signature.signature_bytes).not.toHaveLength(0);
        expect(dropDbTx.signature.signature_type).toBeDefined();
        expect(dropDbTx.body).toBeDefined();
        expect(dropDbTx.body.fee).toBeDefined();
        expect(dropDbTx.body.payload).toBeDefined();
        expect(dropDbTx.body.payload_type).toBeDefined();
        expect(dropDbTx.body.nonce).toBeGreaterThan(0);
        expect(dropDbTx.body.salt).toBeDefined();
        expect(dropDbTx.body.salt.length).toBeGreaterThan(0);
        expect(dropDbTx.sender).toBeDefined();
    });

    test('the database should be able to be broadcasted and return a txHash and a txReceipt', async () => {
        const result = await kwil.broadcast(dropDbTx);
        console.log(result)
        expect(result.data).toBeDefined();
        expect(result.data).toMatchObject<TxReceipt>({
            txHash: expect.any(String),
        });
    });

    test('the database should be dropped', async () => {
        const result = await kwil.listDatabases(wallet.address);
        expect(result.data).toBeDefined();
        expect(result.data).not.toContain(payload);
    });
});