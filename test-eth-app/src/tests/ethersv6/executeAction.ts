import { WebKwil, Utils, KwilSigner } from '../../../../src';
import { ActionInput } from '../../../../src/core/action';

export async function executeAction(
  kwil: WebKwil,
  namespace: string,
  action: string,
  actionInput: ActionInput,
  signer: KwilSigner,
  nonce: number
): Promise<void> {
  //   const query = await kwil.selectQuery(namespace, 'SELECT COUNT(*) FROM posts');
  //   console.log(query);
  //@ts-ignore
  //   const count = query.data[0][`count`];

  //   const actionInput = Utils.ActionInput.of()
  //     .put('$id', Number(count + 1))
  //     .put('$user', 'Luke')
  //     .put('$title', 'Hello')
  //     .put('$body', 'Hello World');

  const res = await kwil.execute(
    {
      namespace,
      name: action,
      inputs: [actionInput],
      description: 'This is a test action',
      nonce,
    },
    signer,
    true
  );

  console.log(res);
}
