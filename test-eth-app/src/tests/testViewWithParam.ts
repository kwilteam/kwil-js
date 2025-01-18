import { Utils, WebKwil, KwilSigner } from '../../../src';

export async function testViewWithParam(
  kwil: WebKwil,
  namespace: string,
  kwilSigner: KwilSigner
): Promise<void> {
  const actionInput = Utils.ActionInput.of().put('$name', 'Kwil');
  const actionInput2 = Utils.ActionInput.of().put('$name', 'Kwil DB');

  const res = await kwil.call(
    {
      namespace,
      // name: 'insert_variables',
      name: 'call_name',
      inputs: [actionInput, actionInput2],
    },
    kwilSigner
  );

  console.log(res);
}
