import { WebKwil, Utils, KwilSigner } from '../../../../src';
import { ActionInput, Entries } from '../../../../src/core/action';
import { v4 as uuidV4 } from 'uuid';

export async function executeAction(
  kwil: WebKwil,
  namespace: string,
  action: string,
  signer: KwilSigner,
  nonce?: number
): Promise<void> {
  // const actionInputData = Utils.ActionInput.of()
  //   .put('$id', 'a1b2c3d4-e5f6-4a5b-9c8d-7e6f5d4c3b2a')
  //   .put('$int_var', 42)
  //   .put('$text_var', 'Sample text')
  //   .put('$bool_var', true)
  //   .put('$decimal_var', '123.45')
  //   .put('$blob', new Uint8Array([1]));

  // const actionInputData2 = Utils.ActionInput.of()
  //   .put('$id', 'e8b5a51d-86e2-4c1c-9d3f-b7c2a5d8f9e0')
  //   .put('$int_var', 42)
  //   .put('$text_var', 'Sample text')
  //   .put('$bool_var', true)
  //   .put('$decimal_var', '123.45')
  //   .put('$blob', new Uint8Array([1]));

  const actionInputData = {
    $id: uuidV4(),
    $int_var: 42,
    $text_var: 'Sample text',
    $bool_var: true,
    $decimal_var: '123.34',
    $blob: new Uint8Array([1]),
  };

  const actionInputData2 = {
    //$id: '123e4567-e89b-12d3-a456-426614174006',
    $id: uuidV4(),
    $int_var: 42,
    $text_var: 'Sample text',
    $bool_var: true,
    $decimal_var: '123.34',
    $blob: new Uint8Array([1]),
  };

  const res = await kwil.execute(
    {
      namespace,
      name: action,
      inputs: [actionInputData, actionInputData2],
      description: 'This is a test action',
      nonce: nonce ? nonce + 1 : undefined,
    },
    signer,
    false
  );

  console.log(res);
}
