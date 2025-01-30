import { WebKwil, Utils, KwilSigner } from '../../../../src';
import { ActionInput, Entries } from '../../../../src/core/action';
import { v4 as uuidV4 } from 'uuid';

export async function executeActionArray(
  kwil: WebKwil,
  namespace: string,
  action: string,
  signer: KwilSigner,
  nonce?: number
): Promise<void> {
  const actionInputData = {
    $id: uuidV4(),
    $text_arr: ['test', 'test2'],
    $int_arr: [1, 2],
  };

  const res = await kwil.execute(
    {
      namespace,
      name: action,
      inputs: [actionInputData],
      description: 'This is a test action',
      nonce: nonce ? nonce + 1 : undefined,
    },
    signer,
    true
  );

  console.log(res);
}
