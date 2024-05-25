const originalLog = console.log;
const logSpy = jest.spyOn(console, 'log').mockImplementation((...args) => {
  originalLog(...args);
});
jest.resetModules();
import {
  AmntObject,
  deployBaseSchema,
  deployIfNoTestDb,
  deployTempSchema,
  deriveKeyPair64,
  dropTestDb,
  kwil,
  wallet,
} from './testingUtils';
import { TxReceipt } from '../dist/core/tx';
import schema from './test_schema2.json';
import { KwilSigner, NodeKwil, Types, Utils } from '../dist/index';
import { MsgReceipt } from '../dist/core/message';
import nacl from 'tweetnacl';
import { Signer as _NearSigner } from 'near-api-js';
import { ActionBody, ActionInput, ActionBodyNode } from '../dist/core/action';
import { DropBody } from '../dist/core/database';
import { EnvironmentType } from '../dist/core/enums';
import dotenv from 'dotenv';
import { AuthSuccess, LogoutResponse } from '../dist/core/auth';
import { Wallet } from 'ethers';

dotenv.config();
const isKgwOn = process.env.GATEWAY_ON === 'TRUE';
const isGasOn = process.env.GAS_ON === 'TRUE';
const address = wallet.address;
const dbid: string = kwil.getDBID(address, 'mydb');
const kSigner = new KwilSigner(wallet, address);

// Kwil methods that do NOT return another class (e.g. funder, action, and DBBuilder)
describe('Kwil Integration Tests', () => {
  const baseDbid = kwil.getDBID(address, 'base_schema');
  beforeAll(async () => {
    await deployIfNoTestDb(kSigner);
    await deployBaseSchema(kSigner);
  }, 20000);

  afterAll(async () => {
    await dropTestDb(dbid, kSigner);
    await dropTestDb(baseDbid, kSigner);
  }, 20000)

  afterEach(() => {
    logSpy.mockClear();
  });

  afterAll(() => {
    logSpy.mockRestore();
  });

  test('getDBID should return the correct value', () => {
    const result = kwil.getDBID(address, 'mydb');
    expect(result).toBe('xc7d4d1d0a43a3692fab62a0be08af1d5de5709792280cabb67c52f3a');
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

  it('execute should submit an action tx', async () => {
    const records = await kwil.selectQuery(dbid, 'SELECT COUNT(*) FROM posts');
    if (!records.status || !records.data) throw new Error('No posts found');

    const amnt = records.data[0] as AmntObject;

    const recordCount = amnt['count'] + 1;

    const actionBody: ActionBody = {
      dbid,
      name: 'add_post',
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

    const result = await kwil.execute(actionBody, kSigner, true);

    expect(result.data).toBeDefined();
    expect(result.data).toMatchObject<TxReceipt>({
      tx_hash: expect.any(String),
    });
  }, 10000);

  test('execute should submit a procedure tx', async () => {
    const records = await kwil.selectQuery(dbid, 'SELECT COUNT(*) FROM posts');
    if (!records.status || !records.data) throw new Error('No posts found');

    const amnt = records.data[0] as AmntObject;

    const recordCount = amnt['count'] + 1;

    const actionBody: ActionBody = {
      dbid,
      name: 'proc_add_user',
      inputs: [
        {
          $id: recordCount,
          $user: 'Luke',
          $title: 'Test Post',
          $body: 'This is a test post',
        },
      ],
      description: 'This is a test procedure',
    };

    const result = await kwil.execute(actionBody, kSigner, true);

    expect(result.data).toBeDefined();
    expect(result.data).toMatchObject<TxReceipt>({
      tx_hash: expect.any(String),
    });
  }, 10000)

  // Todo: Implement this test once this issue is resolved: https://github.com/kwilteam/kwil-db/issues/740
  // test('execute should execute a procedure with a foreign call to another schema', async() => {

  // })

  test('call should submit a view action', async () => {
    const body: ActionBody = {
      dbid,
      name: 'read_posts',
    };

    const result = await kwil.call(body);
    expect(result.status).toBe(200);
    expect(result.data).toMatchObject<MsgReceipt>({
      result: expect.any(Array),
    });
  }, 10000);

  test('call should submit a view procedure', async () => {
    const body: ActionBody = {
      dbid,
      name: 'get_post_by_id',
      inputs: [
        {
          $id: 1,
        },
      ],
    };

    const result = await kwil.call(body);

    expect(result.data).toBeDefined();
    expect(result.status).toBe(200);
    expect(result.data).toMatchObject<MsgReceipt>({
      result: expect.any(Array),
    });
  }, 10000)

  test('call should submit a view procedure that foreign calls a different schema', async () => {
    const body: ActionBody = {
      dbid,
      name: 'proc_call_base',
      inputs: [{
        $dbid: baseDbid,
      }]
    }

    const result = await kwil.call(body);

    expect(result.data).toBeDefined();
    expect(result.status).toBe(200);
    expect(result.data).toMatchObject<MsgReceipt>({
      result: expect.any(Array),
    });
  }, 10000);

  (isGasOn ? test : test.skip)('Kwil.funder should transfer tokens', async () => {
    const funder = kwil.funder;
    const transferBody = {
      to: '0x6E2fA2aF9B4eF5c8A3BcF9A9B9A4F1a1a2c1c1c1',
      amount: BigInt(1),
    };
    const result = await funder.transfer(transferBody, kSigner);
    expect(result.data).toBeDefined();
    expect(result.data).toMatchObject<TxReceipt>({
      tx_hash: expect.any(String),
    });
  }, 10000);

  test('a database should be deployed with kwil.deploy()', async () => {
    const result = await deployTempSchema(schema, kSigner);
    expect(result.data).toBeDefined();
    expect(result.data).toMatchObject<TxReceipt>({
      tx_hash: expect.any(String),
    });
  }, 10000);

  test('a database should be dropped with kwil.drop()', async () => {
    const dbList = await kwil.listDatabases(kSigner.identifier);
    const dbName = `test_db_${dbList.data?.length}`;
    const dbidToDrop = kwil.getDBID(kSigner.identifier, dbName);

    const body: DropBody = {
      dbid: dbidToDrop,
    };

    const result = await kwil.drop(body, kSigner, true);

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
  }, 10000);

  afterAll(async () => {
    const body: DropBody = {
      dbid,
    };

    await kwil.drop(body, kSigner, true);
  }, 10000);

  async function buildActionInput(dbid: string): Promise<ActionInput> {
    const count = await kwil.selectQuery(dbid, 'SELECT COUNT(*) FROM users');
    if (!count || !count.data)
      throw new Error(
        `Something went wrong with the select query in Testing case insentivity on test_db. Count = ${count}`
      );
    const amount = count?.data[0] as AmntObject;
    const amnt = amount['count'];

    return Utils.ActionInput.of()
      .put('$id', amnt + 1)
      .put('$username', 'Luke')
      .put('$age', 25);
  }

  test('createUserTest action should execute', async () => {
    const actionInputs = await buildActionInput(dbid);

    const body: ActionBody = {
      name: 'createUserTest',
      dbid,
      inputs: [actionInputs],
    };

    const result = await kwil.execute(body, kSigner, true);

    expect(result.data).toBeDefined();
    expect(result.data).toMatchObject<TxReceipt>({
      tx_hash: expect.any(String),
    });
  }, 10000);

  test('delete_user action should execute', async () => {
    const body: ActionBody = {
      name: 'delete_user',
      dbid,
    };

    const result = await kwil.execute(body, kSigner, true);

    expect(result.data).toBeDefined();
    expect(result.data).toMatchObject<TxReceipt>({
      tx_hash: expect.any(String),
    });
  }, 10000);

  test('CREATEUSERTEST action should execute', async () => {
    const actionInputs = await buildActionInput(dbid);

    const body: ActionBody = {
      name: 'CREATEUSERTEST',
      dbid,
      inputs: [actionInputs],
    };

    const result = await kwil.execute(body, kSigner, true);

    expect(result.data).toBeDefined();
    expect(result.data).toMatchObject<TxReceipt>({
      tx_hash: expect.any(String),
    });
  }, 10000);

  test('DELETE_USER action should execute', async () => {
    const body: ActionBody = {
      name: 'DELETE_USER',
      dbid
    };

    const result = await kwil.execute(body, kSigner, true);

    expect(result.data).toBeDefined();
    expect(result.data).toMatchObject<TxReceipt>({
      tx_hash: expect.any(String),
    });
  }, 10000);

  test('createusertest action should execute', async () => {
    const actionInputs = await buildActionInput(dbid);

    const body: ActionBody = {
      name: 'createusertest',
      dbid,
      inputs: [actionInputs],
    };

    const result = await kwil.execute(body, kSigner, true);

    expect(result.data).toBeDefined();
    expect(result.data).toMatchObject<TxReceipt>({
      tx_hash: expect.any(String),
    });
  }, 10000);
});

(isKgwOn ? describe : describe.skip)('Testing authentication', () => {
  beforeAll(async () => {
    await deployIfNoTestDb(kSigner);
  }, 10000);

  afterAll(async () => {
    await dropTestDb(dbid, kSigner);
  }, 10000);

  it('should authenticate and return data automatically', async () => {
    const body: ActionBody = {
      name: 'view_must_sign',
      dbid,
    };

    const result = await kwil.call(body, kSigner);

    expect(result.status).toBe(200);
    expect(result.data).toBeDefined();
    expect(result.data).toMatchObject<MsgReceipt>({
      result: expect.any(Array),
    });
  });

  it('should return an expired cookie when logging out', async () => {
    // @ts-ignore
    const preCookie = kwil.cookie;
    const result = await kwil.auth.logout();

    //@ts-ignore
    const postCookie = kwil.cookie;

    expect(result.status).toBe(200);
    expect(result.data).toBeDefined();
    expect(result.data).toMatchObject<LogoutResponse<EnvironmentType.NODE>>({
      result: 'ok',
      cookie: expect.any(String),
    });

    console.log('preCookie:', preCookie);
    console.log('postCookie:', postCookie);
    expect(preCookie).not.toBe(postCookie);
  });

  interface ViewCaller {
    caller: string;
  }

  it('should allow a new signer after logging out', async () => {
    // Log out
    await kwil.auth.logout();

    // Create a new signer
    const newWallet = Wallet.createRandom();

    const newSigner = new KwilSigner(newWallet, newWallet.address);

    const body: ActionBody = {
      name: 'view_caller',
      dbid,
    };

    const result = await kwil.call(body, newSigner);

    const returnedCaller = result.data?.result?.[0] as ViewCaller | undefined;

    expect(result.status).toBe(200);
    expect(result.data).toBeDefined();
    expect(returnedCaller?.caller).toBe(newWallet.address);
  });

  describe('Testing authentication without autoAuthenticate', () => {
    const newKwil = new NodeKwil({
      kwilProvider: process.env.KWIL_PROVIDER || '',
      chainId: process.env.CHAIN_ID || '',
      autoAuthenticate: false,
    });

    it('should not authenticate automatically', async () => {
      const body: ActionBody = {
        name: 'view_must_sign',
        dbid,
      };

      const result = await newKwil.call(body, kSigner);

      expect(result.status).toBe(401);
      expect(result.data?.result).toBe(null);
    });

    it('should authenticate after calling the authenticate method', async () => {
      const result = await newKwil.auth.authenticate(kSigner);

      await newKwil.auth.logout();

      expect(result.status).toBe(200);
      expect(result.data).toMatchObject<AuthSuccess<EnvironmentType.NODE>>({
        result: 'ok',
        cookie: expect.any(String),
      });
    });

    it('should authenticate when the cookie is passed back to the action', async () => {
      const authRes = await newKwil.auth.authenticate(kSigner);
      const cookie = authRes.data?.cookie;

      if (!cookie) throw new Error('No cookie found');

      const body: ActionBodyNode = {
        name: 'view_must_sign',
        dbid,
        cookie
      };

      const result = await newKwil.call(body, kSigner);

      expect(result.status).toBe(200);
      expect(result.data).toBeDefined();
      expect(result.data).toMatchObject<MsgReceipt>({
        result: expect.any(Array),
      });
    });

    it('should not authenticate when a bad cookie is passed back to the action', async () => {
      const body: ActionBodyNode = {
        name: 'view_must_sign',
        dbid,
        cookie: 'badCookie'
      };

      const result = await newKwil.call(body, kSigner);

      expect(result.status).toBe(401);
      expect(result.data?.result).toBe(null);
    });

    it('should continue authenticating after a bad cookie was passed to the previous action', async () => {
      const body: ActionBody = {
        name: 'view_must_sign',
        dbid,
      };

      const result = await newKwil.call(body, kSigner);

      expect(result.status).toBe(200);
      expect(result.data).toBeDefined();
      expect(result.data).toMatchObject<MsgReceipt>({
        result: expect.any(Array),
      });
    });
  });
});

describe('Testing custom signers', () => {
  let edSigner: KwilSigner;
  let input: Types.ActionInput;

  async function getEdKeys(): Promise<nacl.SignKeyPair> {
    return await deriveKeyPair64('69420', '69420');
  }

  async function customEdSigner(msg: Uint8Array): Promise<Uint8Array> {
    const edKeys = await getEdKeys();
    return nacl.sign.detached(msg, edKeys.secretKey);
  }

  beforeAll(async () => {
    const edKeys = await getEdKeys();
    edSigner = new KwilSigner(customEdSigner, edKeys.publicKey, 'ed25519');
    await deployIfNoTestDb(kSigner);
  }, 10000);

  afterAll(async () => {
    await dropTestDb(dbid, kSigner);
  }, 10000);

  beforeEach(async () => {
    let recordCount: number;

    const count = await kwil.selectQuery(dbid, 'SELECT COUNT(*) FROM posts');
    if (count.status == 200 && count.data) {
      const amnt = count.data[0] as AmntObject;
      recordCount = amnt['count'];
    } else {
      throw new Error('Something went wrong checking how many records on users table in the Testing custom signers section')
    }

    input = new Utils.ActionInput();
    input.put('$id', recordCount + 1);
    input.put('$user', 'Luke');
    input.put('$title', 'Test Post');
    input.put('$body', 'This is a test post');
  });


  test("ed25519 signed tx's should broadcast correctly", async () => {
    const body: ActionBody = {
      dbid,
      name: 'add_post',
      inputs: [input],
    };

    const result = await kwil.execute(body, edSigner, true);

    expect(result.data).toBeDefined();
    expect(result.data).toMatchObject<TxReceipt>({
      tx_hash: expect.any(String),
    });
    expect(result.status).toBe(200);
  }, 10000);

  test('ed25519 signed msgs should call correctly', async () => {
    const payload: ActionBody = {
      dbid,
      name: 'view_must_sign',
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
  beforeAll(async () => {
    await deployIfNoTestDb(kSigner)
  }, 10000);

  afterAll(async () => {
    await dropTestDb(dbid, kSigner);
  }, 10000);

  test('kwil.call() with ActionBody interface as first argument, action inputs NOT REQUIRED, and no signature required should return a MsgReceipt', async () => {
    const actionBody: ActionBody = {
      dbid: dbid,
      name: 'read_posts',
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
        name: 'view_with_param',
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
        name: 'view_with_param',
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
      name: 'view_must_sign',
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
        recordCount = amnt['count'] + 1;
      }
    });

    afterEach(() => recordCount++);

    test('with action inputs as array of objects', async () => {
      const actionBody: ActionBody = {
        dbid,
        name: 'add_post',
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

      const result = await kwil.execute(actionBody, kSigner, true);

      expect(result.data).toBeDefined();
      expect(result.status).toBe(200);
      expect(result.data).toMatchObject<TxReceipt>({
        tx_hash: expect.any(String),
      });
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
        name: 'add_post',
        inputs: [input],
        description: 'This is a test action',
      };

      const result = await kwil.execute(actionBody, kSigner, true);

      expect(result.data).toBeDefined();
      expect(result.status).toBe(200);
      expect(result.data).toMatchObject<TxReceipt>({
        tx_hash: expect.any(String),
      });
    }, 10000);

    it('should allow for setting a manual nonce', async () => {
      const acct = await kwil.getAccount(address);
      const nonce = Number(acct.data?.nonce);
      if (!nonce) throw new Error('No nonce found');
      const actionBody: ActionBody = {
        dbid,
        name: 'add_post',
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

      const result = await kwil.execute(actionBody, kSigner, true);

      expect(result.data).toBeDefined();
      expect(result.status).toBe(200);
      expect(result.data).toMatchObject<TxReceipt>({
        tx_hash: expect.any(String),
      });
    }, 10000);

    it('should error if nonce is incorrect', async () => {
      const acct = await kwil.getAccount(address);
      const nonce = Number(acct.data?.nonce);
      if (!nonce) throw new Error('No nonce found');
      const actionBody: ActionBody = {
        dbid,
        name: 'add_post',
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
});

describe('unconfirmedNonce', () => {
  const kwilSigner = new KwilSigner(wallet, address);

  beforeAll(async () => {
    await deployIfNoTestDb(kwilSigner);
  }, 10000);

  afterAll(async () => {
    await dropTestDb(dbid, kwilSigner);
  }, 10000);

  it('should return a nonce that is 1 greater than the current nonce immediately after a transaction', async () => {
    const posts = await kwil.selectQuery(dbid, 'SELECT COUNT(*) FROM posts');
    if (!posts.status || !posts.data) throw new Error('No posts found');
    const amnt = posts.data[0] as AmntObject;
    const recordCount = amnt['count'] + 1;
    const actionBody: ActionBody = {
      dbid,
      name: 'add_post',
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