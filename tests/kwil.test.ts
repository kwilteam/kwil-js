const originalLog = console.log;
const logSpy = jest.spyOn(console, 'log').mockImplementation((...args) => {
  originalLog(...args);
});
jest.resetModules();
import {
  AmntObject,
  deployIfNoTestDb,
  deployTempSchema,
  deriveKeyPair64,
  kwil,
  waitForDeployment,
  wallet,
} from './testingUtils';
import { TxReceipt } from '../dist/core/tx';
import schema from './test_schema2.json';
import { DBBuilderImpl } from '../dist/builders/db_builder';
import { KwilSigner, Types, Utils } from '../dist/index';
import { BaseMessage, Message, MsgReceipt } from '../dist/core/message';
import { hexToBytes } from '../dist/utils/serial';
import { SignatureType } from '../dist/core/signature';
import nacl from 'tweetnacl';
import { Signer as _NearSigner } from 'near-api-js';
import { ActionBody, ActionInput } from '../dist/core/action';
import { DeployBody, DropBody } from '../dist/core/database';
import { PayloadType } from '../dist/core/enums';
import { CompiledKuneiform, DropDbPayload } from '../dist/core/payload';
import { DatasetInfo } from '../dist/core/network';

const isKgwOn = process.env.GATEWAY_ON === 'true';
const isGasOn = process.env.GAS_ON === 'true';
const address: string = '0xAfFDC06cF34aFD7D5801A13d48C92AD39609901D';
const dbid: string = kwil.getDBID(address, 'mydb');
const kSigner = new KwilSigner(wallet, address);

// Kwil methods that do NOT return another class (e.g. funder, action, and DBBuilder)
describe('Kwil', () => {
  beforeAll(async () => {
    await deployIfNoTestDb(kSigner);
  });

  afterEach(() => {
    logSpy.mockClear();
  });

  afterAll(() => {
    logSpy.mockRestore();
  });

  test('getDBID should return the correct value', () => {
    const result = kwil.getDBID(address, 'mydb');
    expect(result).toBe('x52197631a5de74a1e293681181c2a63418d7ae710a3f0370d91a99bd');
    // when on public network, change to: xca20642aa31af7db6b43755cf40be91c51a157e447e6cc36c1d94f0a
    // when on local network, change to: xcdd04ff7c5e4a939d5365ec9b54cc4aab8c610c415f5f9b33323ae77
  });

  let schema: any;

  test('getSchema should return status 200', async () => {
    const result = await kwil.getSchema(dbid);
    schema = result.data;
    expect(result.status).toBe(200);
  });

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
    expect(logSpy).toHaveBeenCalledTimes(2);

    // Reset the mock to ensure it doesn't affect other tests
    jest.resetAllMocks();
    jest.useRealTimers();
  });

  test('getAccount should return status 200', async () => {
    const result = await kwil.getAccount(address);
    expect(result.status).toBe(200);
  });

  test('listDatabases should return status 200', async () => {
    const result = await kwil.listDatabases(address);
    expect(result.status).toBe(200);
  });

  test('ping should return status 200', async () => {
    const result = await kwil.ping();
    expect(result.status).toBe(200);
  });

  test('chainInfo should return a status 200', async () => {
    const result = await kwil.chainInfo();
    expect(result.status).toBe(200);
  });

  test('select should return status 200', async () => {
    const result = await kwil.selectQuery(dbid, 'SELECT * FROM posts LIMIT 5');
    expect(result.status).toBe(200);
  });
});

(isGasOn ? describe : describe.skip)('Testing Kwil.funder', () => {
  const funder = kwil.funder;

  it('should transfer tokens', async () => {
    const transferBody = {
      to: '0x6E2fA2aF9B4eF5c8A3BcF9A9B9A4F1a1a2c1c1c1',
      amount: BigInt(1),
    };
    const result = await funder.transfer(transferBody, kSigner);
    expect(result.data).toBeDefined();
    expect(result.data).toMatchObject<TxReceipt>({
      tx_hash: expect.any(String),
    });
  });
});

// Testing all methods to be called on actionBuilder, actionInput, and the Transaction class and kwil.broadcast()
describe('ActionBuilder + ActionInput + Transaction public methods & broadcasting an action Transaction', () => {
  let recordCount: number;
  let actionInput: Types.ActionInput;
  let actionInputArr: Types.ActionInput[];

  beforeAll(async () => {
    await deployIfNoTestDb(kSigner);
    const count = await kwil.selectQuery(dbid, 'SELECT COUNT(*) FROM posts');
    if (count.status == 200 && count.data) {
      const amnt = count.data[0] as AmntObject;
      recordCount = amnt['COUNT(*)'];
    }

    actionInput = new Utils.ActionInput();
  });

  test('actionInput.put with complete inputs should return the actionInput + inputs', () => {
    actionInput.put('$id', recordCount + 1);
    actionInput.put('$user', 'Luke');
    actionInput.put('$title', 'Test Post');
    actionInput.put('$body', 'This is a test post');

    expect(actionInput).toBeDefined();
    expect(actionInput.get('$id')).toBe(recordCount + 1);
    expect(actionInput.get('$user')).toBe('Luke');
    expect(actionInput.get('$title')).toBe('Test Post');
    expect(actionInput.get('$body')).toBe('This is a test post');
  });

  test('actionInput.putIfAbsent should add the missing $body input', () => {
    actionInput.putIfAbsent('$toBeDeleted', 'This is a test post to be deleted.');

    expect(actionInput).toBeDefined();
    expect(actionInput.get('$id')).toBe(recordCount + 1);
    expect(actionInput.get('$user')).toBe('Luke');
    expect(actionInput.get('$title')).toBe('Test Post');
    expect(actionInput.get('$body')).toBe('This is a test post');
    expect(actionInput.get('$toBeDeleted')).toBe('This is a test post to be deleted.');
  });

  test('actionInput.putIfAbsent should not overwrite existing inputs', () => {
    actionInput.putIfAbsent('$toBeDeleted', 'This is a test post that should not be written.');

    expect(actionInput).toBeDefined();
    expect(actionInput.get('$id')).toBe(recordCount + 1);
    expect(actionInput.get('$user')).toBe('Luke');
    expect(actionInput.get('$title')).toBe('Test Post');
    expect(actionInput.get('$body')).toBe('This is a test post');
    expect(actionInput.get('$toBeDeleted')).toBe('This is a test post to be deleted.');
  });

  test('actionInput.replace should replace a field', () => {
    actionInput.replace(
      '$toBeDeleted',
      'This is a test post that should be replaced and later deleted.'
    );

    expect(actionInput).toBeDefined();
    expect(actionInput.get('$id')).toBe(recordCount + 1);
    expect(actionInput.get('$user')).toBe('Luke');
    expect(actionInput.get('$title')).toBe('Test Post');
    expect(actionInput.get('$body')).toBe('This is a test post');
    expect(actionInput.get('$toBeDeleted')).toBe(
      'This is a test post that should be replaced and later deleted.'
    );
  });

  test('actionInput.replace should not replace a field that does not exist', () => {
    actionInput.replace('$noExists', 'This is a test post that should not be included.');

    expect(actionInput).toBeDefined();
    expect(actionInput.get('$id')).toBe(recordCount + 1);
    expect(actionInput.get('$user')).toBe('Luke');
    expect(actionInput.get('$title')).toBe('Test Post');
    expect(actionInput.get('$body')).toBe('This is a test post');
    expect(actionInput.get('$toBeDeleted')).toBe(
      'This is a test post that should be replaced and later deleted.'
    );
    expect(actionInput.get('$noExists')).toBeUndefined();
  });

  test('actionInput.getOrDefault should return the value of an existing field', () => {
    const result = actionInput.getOrDefault('$body', 'This is the default value');
    expect(result).toBe('This is a test post');
  });

  test('actionInput.getOrDefault should return the default value of a non-existing field', () => {
    const result = actionInput.getOrDefault('$noExists', 'This is the default value');
    expect(result).toBe('This is the default value');
  });

  test('actionInput.containsKey should return true for a property in the actionInput', () => {
    const result = actionInput.containsKey('$id');
    expect(result).toBe(true);
  });

  test('actionInput.containsKey should return false for a property not in the actionInput', () => {
    const result = actionInput.containsKey('$noExists');
    expect(result).toBe(false);
  });

  test('actionInput.remove should remove a property from the actionInput', () => {
    actionInput.remove('$toBeDeleted');
    expect(actionInput.containsKey('$toBeDeleted')).toBe(false);
    expect(actionInput.get('$toBeDeleted')).toBeUndefined();
  });

  test('actionInput.toArray should return an array of entries', () => {
    const result = actionInput.toArray();
    expect(result).toBeDefined();
    expect(result).toBeInstanceOf(Array);
    expect(result).toHaveLength(4);
    expect(result).toMatchObject([
      ['$id', recordCount + 1],
      ['$user', 'Luke'],
      ['$title', 'Test Post'],
      ['$body', 'This is a test post'],
    ]);
  });

  test('actionInput should be iterable', () => {
    let count = 0;
    for (const entry of actionInput) {
      expect(entry).toBeDefined();
      expect(entry).toBeInstanceOf(Array);
      expect(entry).toHaveLength(2);
      count++;
    }

    expect(count).toBe(4);
  });

  test('actionInput.putFromObject should add all properties from an object', () => {
    actionInput.remove('$id');
    actionInput.remove('$user');
    actionInput.remove('$title');
    actionInput.remove('$body');

    //check that actionInput is empty
    expect(actionInput.get('$id')).toBeUndefined();
    expect(actionInput.get('$user')).toBeUndefined();
    expect(actionInput.get('$title')).toBeUndefined();
    expect(actionInput.get('$body')).toBeUndefined();

    //create obj
    const obj = {
      $id: `${recordCount + 1} will be replaced`,
      $user: 'Luke will be replaced',
      $title: 'Test Post will be replaced',
    };

    actionInput.putFromObject(obj);

    expect(actionInput).toBeDefined();
    expect(actionInput.get('$id')).toBe(`${recordCount + 1} will be replaced`);
    expect(actionInput.get('$user')).toBe('Luke will be replaced');
    expect(actionInput.get('$title')).toBe('Test Post will be replaced');
  });

  test('actionInput.putFromObjectIfAbsent should add all properties from an object if they do not exist', () => {
    const obj = {
      $id: 'This should not be entered',
      $user: 'This should not be entered',
      $title: 'This should not be entered',
      $body: 'This is a test post will be replaced',
    };

    actionInput.putFromObjectIfAbsent(obj);

    expect(actionInput).toBeDefined();
    expect(actionInput.get('$id')).toBe(`${recordCount + 1} will be replaced`);
    expect(actionInput.get('$user')).toBe('Luke will be replaced');
    expect(actionInput.get('$title')).toBe('Test Post will be replaced');
    expect(actionInput.get('$body')).toBe('This is a test post will be replaced');
  });

  test('actionInput.replaceFromObject', () => {
    const obj = {
      $id: recordCount + 1,
      $user: 'Luke',
      $title: 'Test Post',
      $body: 'This is a test post',
    };

    actionInput.replaceFromObject(obj);

    expect(actionInput).toBeDefined();
    expect(actionInput.get('$id')).toBe(recordCount + 1);
    expect(actionInput.get('$user')).toBe('Luke');
    expect(actionInput.get('$title')).toBe('Test Post');
    expect(actionInput.get('$body')).toBe('This is a test post');
  });

  test('actionInput.putFromObjects should return an array of ActionInputs', () => {
    const values = [
      {
        $id: recordCount + 2,
        $user: 'Luke',
        $title: 'Test Post',
        $body: 'This is a test post',
      },
      {
        $id: recordCount + 3,
        $user: 'Luke',
        $title: 'Test Post',
        $body: 'This is a test post',
      },
    ];

    actionInputArr = actionInput.putFromObjects(values);

    expect(actionInputArr).toBeDefined();
    expect(actionInputArr).toBeInstanceOf(Array);
    expect(actionInputArr).toHaveLength(2);
    expect(actionInputArr[0]).toBeInstanceOf(ActionInput);
    expect(actionInputArr[0].get('$id')).toBe(recordCount + 2);
    expect(actionInputArr[0].get('$user')).toBe('Luke');
    expect(actionInputArr[0].get('$title')).toBe('Test Post');
    expect(actionInputArr[0].get('$body')).toBe('This is a test post');
    expect(actionInputArr[1]).toBeInstanceOf(ActionInput);
    expect(actionInputArr[1].get('$id')).toBe(recordCount + 3);
    expect(actionInputArr[1].get('$user')).toBe('Luke');
    expect(actionInputArr[1].get('$title')).toBe('Test Post');
    expect(actionInputArr[1].get('$body')).toBe('This is a test post');
  });

  let staticActionInputFrom: Types.ActionInput;

  test('The static actionInput.from() method should accept an array of key value pairs and return an action', () => {
    staticActionInputFrom = Utils.ActionInput.from([
      ['$id', recordCount + 4],
      ['$user', 'Luke'],
      ['$title', 'Test Post'],
      ['$body', 'This is a test post'],
    ]);

    expect(staticActionInputFrom).toBeDefined();
    expect(staticActionInputFrom).toBeInstanceOf(ActionInput);
    expect(staticActionInputFrom.get('$id')).toBe(recordCount + 4);
    expect(staticActionInputFrom.get('$user')).toBe('Luke');
    expect(staticActionInputFrom.get('$title')).toBe('Test Post');
    expect(staticActionInputFrom.get('$body')).toBe('This is a test post');
  });

  let staticActionInputFromObject: Types.ActionInput;

  test('The static actionInput.fromObject() method should accept an object and return an action', () => {
    const obj = {
      $id: recordCount + 5,
      $user: 'Luke',
      $title: 'Test Post',
      $body: 'This is a test post',
    };

    staticActionInputFromObject = Utils.ActionInput.fromObject(obj);

    expect(staticActionInputFromObject).toBeDefined();
    expect(staticActionInputFromObject).toBeInstanceOf(ActionInput);
    expect(staticActionInputFromObject.get('$id')).toBe(recordCount + 5);
    expect(staticActionInputFromObject.get('$user')).toBe('Luke');
    expect(staticActionInputFromObject.get('$title')).toBe('Test Post');
    expect(staticActionInputFromObject.get('$body')).toBe('This is a test post');
  });

  let staticActionInputFromObjects: Types.ActionInput[];

  test('The static actionInput.fromObjects() method should accept an array of objects and return an array of actions', () => {
    const objs = [
      {
        $id: recordCount + 6,
        $user: 'Luke',
        $title: 'Test Post',
        $body: 'This is a test post',
      },
      {
        $id: recordCount + 7,
        $user: 'Luke',
        $title: 'Test Post',
        $body: 'This is a test post',
      },
    ];

    staticActionInputFromObjects = Utils.ActionInput.fromObjects(objs);

    expect(staticActionInputFromObjects).toBeDefined();
    expect(staticActionInputFromObjects).toBeInstanceOf(Array);
    expect(staticActionInputFromObjects).toHaveLength(2);
    expect(staticActionInputFromObjects[0]).toBeInstanceOf(ActionInput);
    expect(staticActionInputFromObjects[0].get('$id')).toBe(recordCount + 6);
    expect(staticActionInputFromObjects[0].get('$user')).toBe('Luke');
    expect(staticActionInputFromObjects[0].get('$title')).toBe('Test Post');
    expect(staticActionInputFromObjects[0].get('$body')).toBe('This is a test post');
    expect(staticActionInputFromObjects[1]).toBeInstanceOf(ActionInput);
    expect(staticActionInputFromObjects[1].get('$id')).toBe(recordCount + 7);
    expect(staticActionInputFromObjects[1].get('$user')).toBe('Luke');
    expect(staticActionInputFromObjects[1].get('$title')).toBe('Test Post');
    expect(staticActionInputFromObjects[1].get('$body')).toBe('This is a test post');
  });

  test('The static actionInput.of() method should return an empty action', () => {
    const result = Utils.ActionInput.of();

    expect(result).toBeDefined();
    expect(result).toBeInstanceOf(ActionInput);
    expect(result.get('$id')).toBeUndefined();
    expect(result.get('$user')).toBeUndefined();
    expect(result.get('$title')).toBeUndefined();
    expect(result.get('$body')).toBeUndefined();
  });

  let staticActionInputOf: Types.ActionInput;
  test('The static actionInput.of() method should return an action with the given inputs', () => {
    staticActionInputOf = Utils.ActionInput.of()
      .put('$id', recordCount + 8)
      .put('$user', 'Luke')
      .put('$title', 'Test Post')
      .put('$body', 'This is a test post');

    expect(staticActionInputOf).toBeDefined();
    expect(staticActionInputOf).toBeInstanceOf(ActionInput);
    expect(staticActionInputOf.get('$id')).toBe(recordCount + 8);
    expect(staticActionInputOf.get('$user')).toBe('Luke');
    expect(staticActionInputOf.get('$title')).toBe('Test Post');
    expect(staticActionInputOf.get('$body')).toBe('This is a test post');
  });

  test('The actionInput should be able to be added to an action and executed on a database', async () => {
    const payload: ActionBody = {
      dbid,
      action: 'add_post',
      inputs: [actionInput],
    };

    const res = await kwil.execute(payload, kSigner);

    await waitForDeployment(res.data?.tx_hash);

    expect(res.data).toBeDefined();
    expect(res.data).toMatchObject<TxReceipt>({
      tx_hash: expect.any(String),
    });
  }, 10000);
});

// Testing all methods to be called on DBBuilder and in relation to DBBuilder (e.g. kwil.newDatabase & kwil.broadcast)
describe('Testing database deploy with kwil.deploy()', () => {
  test('a database should be deployed with kwil.deploy()', async () => {
    const result = await deployTempSchema(schema, kSigner);
    expect(result.data).toBeDefined();
    expect(result.data).toMatchObject<TxReceipt>({
      tx_hash: expect.any(String),
    });
  }, 10000);
});

describe('Testing case insentivity on test_db', () => {
  let dbid: string;

  beforeAll(async () => {
    const res = await kwil.listDatabases(kSigner.identifier);
    const dbList = res.data;
    if (!dbList) {
      await deployTempSchema(schema, kSigner);
      return;
    }

    for (const db of dbList) {
      if (db.name.startsWith('test_db_')) {
        dbid = db.dbid;
        return;
      }
    }

    await deployTempSchema(schema, kSigner);
    dbid = kwil.getDBID(kSigner.identifier, 'test_db_1');
  });

  async function buildActionInput(dbid: string): Promise<ActionInput> {
    const count = await kwil.selectQuery(dbid, 'SELECT COUNT(*) FROM users');
    if (!count || !count.data)
      throw new Error(
        `Something went wrong with the select query in Testing case insentivity on test_db. Count = ${count}`
      );
    const amount = count?.data[0] as AmntObject;
    const amnt = amount['COUNT(*)'];

    return Utils.ActionInput.of()
      .put('$id', amnt + 1)
      .put('$username', 'Luke')
      .put('$age', 25);
  }

  test('createUserTest action should execute', async () => {
    const actionInputs = await buildActionInput(dbid);

    const body: ActionBody = {
      action: 'createUserTest',
      dbid,
      inputs: [actionInputs],
    };

    const result = await kwil.execute(body, kSigner);

    await waitForDeployment(result.data?.tx_hash);

    expect(result.data).toBeDefined();
    expect(result.data).toMatchObject<TxReceipt>({
      tx_hash: expect.any(String),
    });
  }, 10000);

  test('delete_user action should execute', async () => {
    const actionInputs = await buildActionInput(dbid);

    const body: ActionBody = {
      action: 'delete_user',
      dbid,
      inputs: [actionInputs],
    };

    const result = await kwil.execute(body, kSigner);

    await waitForDeployment(result.data?.tx_hash);

    expect(result.data).toBeDefined();
    expect(result.data).toMatchObject<TxReceipt>({
      tx_hash: expect.any(String),
    });
  }, 10000);

  test('CREATEUSERTEST action should execute', async () => {
    const actionInputs = await buildActionInput(dbid);

    const body: ActionBody = {
      action: 'CREATEUSERTEST',
      dbid,
      inputs: [actionInputs],
    };

    const result = await kwil.execute(body, kSigner);

    await waitForDeployment(result.data?.tx_hash);

    expect(result.data).toBeDefined();
    expect(result.data).toMatchObject<TxReceipt>({
      tx_hash: expect.any(String),
    });
  }, 10000);

  test('DELETE_USER action should execute', async () => {
    const actionInputs = await buildActionInput(dbid);

    const body: ActionBody = {
      action: 'DELETE_USER',
      dbid,
      inputs: [actionInputs],
    };

    const result = await kwil.execute(body, kSigner);

    await waitForDeployment(result.data?.tx_hash);

    expect(result.data).toBeDefined();
    expect(result.data).toMatchObject<TxReceipt>({
      tx_hash: expect.any(String),
    });
  }, 10000);

  test('createusertest action should execute', async () => {
    const actionInputs = await buildActionInput(dbid);

    const body: ActionBody = {
      action: 'createusertest',
      dbid,
      inputs: [actionInputs],
    };

    const result = await kwil.execute(body, kSigner);

    await waitForDeployment(result.data?.tx_hash);

    expect(result.data).toBeDefined();
    expect(result.data).toMatchObject<TxReceipt>({
      tx_hash: expect.any(String),
    });
  }, 10000);
});

// // Testing ActionBuilder to a Message and the kwil.call() api
describe('Calling Actions', () => {
  test('kwil.call() should return a MsgReceipt', async () => {
    const body: ActionBody = {
      dbid,
      action: 'read_posts',
    };

    const result = await kwil.call(body, kSigner);
    expect(result.status).toBe(200);
    expect(result.data).toMatchObject<MsgReceipt>({
      result: expect.any(Array),
    });
  });
});

(isKgwOn ? describe.skip : describe)('Testing authentication', () => {
  it('should authenticate and return data automatically', async () => {
    const body: ActionBody = {
      action: 'view_must_sign',
      dbid,
    };

    const result = await kwil.call(body, kSigner);

    expect(result.status).toBe(200);
    expect(result.data).toBeDefined();
    expect(result.data).toMatchObject<MsgReceipt>({
      result: expect.any(Array),
    });
  });
});

// Testing all methods on Drop Database
describe('Drop Database', () => {
  test('kwil.drop() should drop a database', async () => {
    const dbList = await kwil.listDatabases(kSigner.identifier);
    const dbName = `test_db_${dbList.data?.length}`;
    const dbidToDrop = kwil.getDBID(kSigner.identifier, dbName);

    const body: DropBody = {
      dbid: dbidToDrop,
    };

    const result = await kwil.drop(body, kSigner);

    await waitForDeployment(result.data?.tx_hash);

    expect(result.data).toBeDefined();
    expect(result.data).toMatchObject<TxReceipt>({
      tx_hash: expect.any(String),
    });
  }, 10000);
});

describe('Testing custom signers', () => {
  const secpSigner = new KwilSigner(wallet, address);
  let edSigner: KwilSigner;
  let input: Types.ActionInput;

  async function getEdKeys(): Promise<nacl.SignKeyPair> {
    return await deriveKeyPair64('69420', '69420');
  }

  async function customSecpSigner(msg: Uint8Array): Promise<Uint8Array> {
    const sig = await wallet.signMessage(msg);
    return hexToBytes(sig);
  }

  async function customEdSigner(msg: Uint8Array): Promise<Uint8Array> {
    const edKeys = await getEdKeys();
    return nacl.sign.detached(msg, edKeys.secretKey);
  }

  beforeAll(async () => {
    const edKeys = await getEdKeys();
    edSigner = new KwilSigner(customEdSigner, edKeys.publicKey, 'ed25519');
  });

  beforeEach(async () => {
    let recordCount: number;

    const count = await kwil.selectQuery(dbid, 'SELECT COUNT(*) FROM posts');
    if (count.status == 200 && count.data) {
      const amnt = count.data[0] as AmntObject;
      recordCount = amnt['COUNT(*)'];
    } else {
        throw new Error('Something went wrong checking how many records on users table in the Testing custom signers section')
    }

    input = new Utils.ActionInput();
    input.put('$id', recordCount + 1);
    input.put('$user', 'Luke');
    input.put('$title', 'Test Post');
    input.put('$body', 'This is a test post');
  });

  test("secp256k1 signed tx's should broadcast correctly", async () => {
    const body: ActionBody = {
      dbid,
      action: 'add_post',
      inputs: [input],
    };

    console.log('secpt256k1 body', input)

    const result = await kwil.execute(body, secpSigner);

    await waitForDeployment(result.data?.tx_hash);

    expect(result.data).toBeDefined();
    expect(result.data).toMatchObject<TxReceipt>({
      tx_hash: expect.any(String),
    });
    expect(result.status).toBe(200);
  }, 10000);

  test('secp256k1 signed msgs should call correctly', async () => {
    const payload: ActionBody = {
      dbid,
      action: 'view_must_sign',
    };

    const result = await kwil.call(payload, secpSigner);

    expect(result.data).toBeDefined();
    expect(result.data).toMatchObject<MsgReceipt>({
      result: expect.any(Array),
    });
    expect(result.status).toBe(200);
  });

  test("ed25519 signed tx's should broadcast correctly", async () => {
    const body: ActionBody = {
      dbid,
      action: 'add_post',
      inputs: [input],
    };

    console.log('ed25519 body', input)

    const result = await kwil.execute(body, edSigner);

    await waitForDeployment(result.data?.tx_hash);

    expect(result.data).toBeDefined();
    expect(result.data).toMatchObject<TxReceipt>({
      tx_hash: expect.any(String),
    });
    expect(result.status).toBe(200);
  }, 10000);

  test('ed25519 signed msgs should call correctly', async () => {
    const payload: ActionBody = {
      dbid,
      action: 'view_must_sign',
    };

    const result = await kwil.call(payload, edSigner);

    expect(result.data).toBeDefined();
    expect(result.data).toMatchObject<MsgReceipt>({
      result: expect.any(Array),
    });
    expect(result.status).toBe(200);
  });
});

describe('Testing simple actions and db deploy / drop (builder pattern alternative)', () => {
  test('kwil.call() with ActionBody interface as first argument, action inputs NOT REQUIRED, and no signature required should return a MsgReceipt', async () => {
    const actionBody: ActionBody = {
      dbid: dbid,
      action: 'read_posts',
    };

    const result = await kwil.call(actionBody);
    expect(result.data).toBeDefined();
    expect(result.status).toBe(200);
    expect(result.data).toMatchObject<MsgReceipt>({
      result: expect.any(Array),
    });
  });

  describe('kwil.call() with ActionBody interface as first argument, action inputs REQUIRED, and no signature required should return a MsgReceipt', () => {
    test('with action inputs as array of objects', async () => {
      const actionBody: ActionBody = {
        dbid,
        action: 'view_with_param',
        inputs: [
          {
            $id: 1,
          },
        ],
      };

      const result = await kwil.call(actionBody);
      expect(result.data).toBeDefined();
      expect(result.status).toBe(200);
      expect(result.data).toMatchObject<MsgReceipt>({
        result: expect.any(Array),
      });
    });

    test('with action inputs as ActionInput', async () => {
      const input = ActionInput.of().put('$id', 1);

      const actionBody: ActionBody = {
        dbid,
        action: 'view_with_param',
        inputs: [input],
      };

      const result = await kwil.call(actionBody);

      expect(result.data).toBeDefined();
      expect(result.status).toBe(200);
      expect(result.data).toMatchObject<MsgReceipt>({
        result: expect.any(Array),
      });
    });
  });

  test('kwil.call() with ActionBody interface as first argument, action inputs NOT REQUIRED, and signature required should return a MsgReceipt', async () => {
    const actionBody: ActionBody = {
      dbid,
      action: 'view_must_sign',
      description: 'This is a test action',
    };

    const result = await kwil.call(actionBody, kSigner);
    expect(result.data).toBeDefined();
    expect(result.status).toBe(200);
    expect(result.data).toMatchObject<MsgReceipt>({
      result: expect.any(Array),
    });
  });

  describe('kwil.execute() with ActionBody interface as first argument, action inputs ARE REQUIRED should return a TxReceipt', () => {
    let recordCount: number;

    beforeAll(async () => {
      const count = await kwil.selectQuery(dbid, 'SELECT COUNT(*) FROM posts');
      if (count.status == 200 && count.data) {
        const amnt = count.data[0] as AmntObject;
        recordCount = amnt['COUNT(*)'] + 1;
      }
    });

    afterEach(() => recordCount++);

    test('with action inputs as array of objects', async () => {
      const actionBody: ActionBody = {
        dbid,
        action: 'add_post',
        inputs: [
          {
            $id: recordCount,
            $user: 'Luke',
            $title: 'Test Post',
            $body: 'This is a test post',
          },
        ],
        description: 'This is a test action',
      };

      const result = await kwil.execute(actionBody, kSigner);
      const hash = result.data?.tx_hash;

      expect(result.data).toBeDefined();
      expect(result.status).toBe(200);
      expect(result.data).toMatchObject<TxReceipt>({
        tx_hash: expect.any(String),
      });

      await waitForDeployment(hash as string);
    }, 10000);

    test('with action inputs as ActionInput', async () => {
      const input = ActionInput.of().putFromObject({
        $id: recordCount,
        $user: 'Luke',
        $title: 'Test Post',
        $body: 'This is a test post',
      });

      const actionBody: ActionBody = {
        dbid,
        action: 'add_post',
        inputs: [input],
        description: 'This is a test action',
      };

      const result = await kwil.execute(actionBody, kSigner);
      const hash = result.data?.tx_hash;

      expect(result.data).toBeDefined();
      expect(result.status).toBe(200);
      expect(result.data).toMatchObject<TxReceipt>({
        tx_hash: expect.any(String),
      });

      await waitForDeployment(hash as string);
    }, 10000);

    it('should allow for setting a manual nonce', async () => {
      const acct = await kwil.getAccount(address);
      const nonce = Number(acct.data?.nonce);
      if (!nonce) throw new Error('No nonce found');
      const actionBody: ActionBody = {
        dbid,
        action: 'add_post',
        inputs: [
          {
            $id: recordCount,
            $user: 'Luke',
            $title: 'Test Post',
            $body: 'This is a test post',
          },
        ],
        description: 'This is a test action',
        nonce: nonce + 1,
      };

      const result = await kwil.execute(actionBody, kSigner);
      const hash = result.data?.tx_hash;

      expect(result.data).toBeDefined();
      expect(result.status).toBe(200);
      expect(result.data).toMatchObject<TxReceipt>({
        tx_hash: expect.any(String),
      });

      await waitForDeployment(hash as string);
    }, 10000);

    it('should error if nonce is incorrect', async () => {
      const acct = await kwil.getAccount(address);
      const nonce = Number(acct.data?.nonce);
      if (!nonce) throw new Error('No nonce found');
      const actionBody: ActionBody = {
        dbid,
        action: 'add_post',
        inputs: [
          {
            $id: recordCount,
            $user: 'Luke',
            $title: 'Test Post',
            $body: 'This is a test post',
          },
        ],
        description: 'This is a test action',
        nonce: nonce - 1,
      };

      await expect(kwil.execute(actionBody, kSigner)).rejects.toThrowError();
    });
  });

  describe('kwil.deploy() and kwil.drop() should each return a TxReceipt', () => {
    let dbName: string;

    beforeAll(async () => {
      const dbAmount = await kwil.listDatabases(kSigner.identifier);
      const count = dbAmount.data as DatasetInfo[];
      dbName = `test_db_${count.length + 1}`;
    });

    test('kwil.deploy()', async () => {
      let kfSchema: CompiledKuneiform = schema;
      kfSchema.name = dbName;
      kfSchema.owner = kSigner.identifier;
      const deployBody: DeployBody = {
        schema: kfSchema,
        description: 'This is a test database',
      };

      const result = await kwil.deploy(deployBody, kSigner);

      const hash = result.data?.tx_hash;

      expect(result.data).toBeDefined();
      expect(result.status).toBe(200);
      expect(result.data).toMatchObject<TxReceipt>({
        tx_hash: expect.any(String),
      });

      await waitForDeployment(hash as string);
    }, 10000);

    test('kwil.drop()', async () => {
      const dbid = kwil.getDBID(kSigner.identifier, dbName);
      const dropBody: DropBody = {
        dbid,
        description: 'This is a test database',
      };

      const result = await kwil.drop(dropBody, kSigner);
      const hash = result.data?.tx_hash;

      expect(result.data).toBeDefined();
      expect(result.status).toBe(200);
      expect(result.data).toMatchObject<TxReceipt>({
        tx_hash: expect.any(String),
      });

      await waitForDeployment(hash as string);
    }, 10000);
  });
});

describe('unconfirmedNonce', () => {
  const kwilSigner = new KwilSigner(wallet, address);

  it('should return a nonce that is 1 greater than the current nonce immediately after a transaction', async () => {
    const posts = await kwil.selectQuery(dbid, 'SELECT COUNT(*) FROM posts');
    if (!posts.status || !posts.data) throw new Error('No posts found');
    const amnt = posts.data[0] as AmntObject;
    const recordCount = amnt['COUNT(*)'] + 1;
    const actionBody: ActionBody = {
      dbid,
      action: 'add_post',
      inputs: [
        {
          $id: recordCount,
          $user: 'Luke',
          $title: 'Test Post',
          $body: 'This is a test post',
        },
      ],
      description: 'This is a test action',
    };
    const initAccount = await kwil.getAccount(address);
    const initialNonce = Number(initAccount.data?.nonce);
    await kwil.execute(actionBody, kwilSigner);
    const account = await kwil.getAccount(address);
    const nonce = Number(account.data?.nonce);
    expect(nonce).toBe(initialNonce + 1);
  });
});
