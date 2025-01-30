import { kwilSigner, deriveKeyPair64, kwil } from './setup';
import { KwilSigner, Types, Utils } from '../../src/index';

import nacl from 'tweetnacl';
import { ActionBody } from '../../src/core/action';
import { TxReceipt } from '../../src/core/tx';
import { MsgReceipt } from '../../src/core/message';

describe('Testing custom signers', () => {
  let edSigner: KwilSigner;
  let input: Types.ActionInput;
  const namespace = 'signers_test';

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
    // TODO: Need to deploy simple schema
  }, 10000);

  afterAll(async () => {
    // TODO: Need to drop simple schema
  }, 10000);

  beforeEach(async () => {
    input = new Utils.ActionInput();
    input.put('$user', 'Luke');
    input.put('$title', 'Test Post');
    input.put('$body', 'This is a test post');
  });

  it("should broadcast ed25519 signed tx's correctly", async () => {
    const body: ActionBody = {
      namespace,
      name: 'add_post',
      inputs: [input],
    };

    const result = await kwil.execute(body, edSigner, true);

    expect(result.data).toBeDefined();
    expect(result.data).toMatchObject<TxReceipt>({
      tx_hash: expect.any(String),
    });
  }, 10000);

  it('should call ed25519 signed msgs correctly', async () => {
    const payload: ActionBody = {
      namespace,
      name: 'view_must_sign',
    };

    const result = await kwil.call(payload, edSigner);

    expect(result.data).toBeDefined();
    expect(result.data).toMatchObject<MsgReceipt>({
      result: expect.any(Array),
    });
  });
});
