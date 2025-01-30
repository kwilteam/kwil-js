import { kwilSigner, isKwildPrivateOn, isKgwOn, kwil, address } from './setup';
import { MsgReceipt } from '../../src/core/message';
import { TxReceipt } from '../../src/core/tx';
import { ActionBody } from '../../src/core/action';

describe('Testing simple actions and db deploy / drop (builder pattern alternative)', () => {
  const dbid = 'action_db';
  beforeAll(async () => {
    // TODO: Need to deploy simple schema
  }, 10000);

  afterAll(async () => {
    // TODO: Need to drop simple schema
  }, 10000);

  it('should return a MsgReceipt when kwil.call() with ActionBody interface as first argument, action inputs NOT REQUIRED, and no signature required', async () => {
    const actionBody: ActionBody = {
      dbid: dbid,
      name: 'read_posts',
    };

    let result;
    if (isKwildPrivateOn || isKgwOn) {
      result = await kwil.call(actionBody, kwilSigner);
    } else {
      result = await kwil.call(actionBody);
    }

    expect(result.data).toBeDefined();
    expect(result.data).toMatchObject<MsgReceipt>({
      result: expect.any(Array),
    });
  });

  describe('kwil.call() with ActionBody interface as first argument, action inputs REQUIRED, and no signature required', () => {
    it('should return a MsgReceipt with action inputs as array of objects', async () => {
      const actionBody: ActionBody = {
        dbid,
        name: 'view_with_param',
        inputs: [
          {
            $title: 'Test Post',
          },
        ],
      };

      let result;
      if (isKwildPrivateOn || isKgwOn) {
        result = await kwil.call(actionBody, kwilSigner);
      } else {
        result = await kwil.call(actionBody);
      }

      expect(result.data).toBeDefined();
      expect(result.data).toMatchObject<MsgReceipt>({
        result: expect.any(Array),
      });
    });

    it('should return a MsgReceipt with action inputs as ActionInput', async () => {
      const input = {
        $title: 'Test Post',
      };

      const actionBody: ActionBody = {
        dbid,
        namespachhe: 'test',
        name: 'view_with_param',
        inputs: [input],
      };

      let result;
      if (isKwildPrivateOn || isKgwOn) {
        result = await kwil.call(actionBody, kwilSigner);
      } else {
        result = await kwil.call(actionBody);
      }

      expect(result.data).toBeDefined();
      expect(result.data).toMatchObject<MsgReceipt>({
        result: expect.any(Object),
      });
    });
  });

  (isKgwOn ? it : it.skip)(
    'should return a MsgReceipt when kwil.call() with ActionBody interface as first argument, action inputs NOT REQUIRED, and signature required',
    async () => {
      const actionBody: ActionBody = {
        dbid,
        name: 'view_must_sign',
        description: 'This is a test action',
      };

      const result = await kwil.call(actionBody, kwilSigner);

      expect(result.data).toBeDefined();
      expect(result.data).toMatchObject<MsgReceipt>({
        result: expect.any(Array),
      });
    }
  );

  describe('kwil.execute() with ActionBody interface as first argument, action inputs ARE REQUIRED', () => {
    it('should return a TxReceipt with action inputs as array of objects', async () => {
      const actionBody: ActionBody = {
        dbid,
        name: 'add_post',
        inputs: [
          {
            $user: 'Luke',
            $title: 'Test Post',
            $body: 'This is a test post',
          },
        ],
        description: 'This is a test action',
      };

      const result = await kwil.execute(actionBody, kwilSigner, true);

      expect(result.data).toBeDefined();
      expect(result.data).toMatchObject<TxReceipt>({
        tx_hash: expect.any(String),
      });
    }, 10000);

    it('should return a TxReceipt with action inputs as ActionInput', async () => {
      const input = {
        $user: 'Luke',
        $title: 'Test Post',
        $body: 'This is a test post',
      };

      const actionBody: ActionBody = {
        dbid,
        name: 'add_post',
        inputs: [input],
        description: 'This is a test action',
      };

      const result = await kwil.execute(actionBody, kwilSigner, true);

      expect(result.data).toBeDefined();
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
            $user: 'Luke',
            $title: 'Test Post',
            $body: 'This is a test post',
          },
        ],
        description: 'This is a test action',
        nonce: nonce + 1,
      };

      const result = await kwil.execute(actionBody, kwilSigner, true);

      expect(result.data).toBeDefined();
      expect(result.data).toMatchObject<TxReceipt>({
        tx_hash: expect.any(String),
      });
    }, 10000);
  });
});
