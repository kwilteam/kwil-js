import { Utils, WebKwil, KwilSigner } from '../../../src';

export async function testViewWithParam(
  kwil: WebKwil,
  namespace: string,
  kwilSigner: KwilSigner
): Promise<void> {
  //const actionInput = Utils.ActionInput.of().put('$id', uuidString);
  const newActionInput = { $name: 'Kwil DB' };
  // const actionInput2 = { $name: 'Test' };

  const res = await kwil.call(
    {
      namespace,
      dbid: 'test',
      name: 'call_name',
      inputs: [newActionInput],
    },
    kwilSigner
  );

  console.log(res);
}
