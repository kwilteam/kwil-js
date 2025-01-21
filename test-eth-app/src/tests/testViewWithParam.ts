import { Utils, WebKwil, KwilSigner } from '../../../src';

export async function testViewWithParam(
  kwil: WebKwil,
  namespace: string,
  kwilSigner: KwilSigner
): Promise<void> {
  const uuidString = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
  //const uuid2 = 'f47ac10b58cc4372a5670e02b2c3d479';
  //const actionInput = Utils.ActionInput.of().put('$id', uuidString);
  const actionInput2 = Utils.ActionInput.of().put('$name', 'Kwil DB');
  const newActionInput = { $name: 'Kwil DB', $id: uuidString };

  const res = await kwil.call(
    {
      namespace,
      dbid: 'test',
      name: 'call_name',
      // name: 'get_variable_by_id',
      // inputs: [newActionInput],
      inputs: [actionInput2],
    },
    kwilSigner
  );

  console.log(res);
}
