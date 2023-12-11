import { Config } from '../../api_client/config';
import { ActionBuilderImpl } from '../../builders/action_builder';
import { ActionBody, ActionInput, Entries } from '../../core/action';
import { AuthSuccess } from '../../core/auth';
import { EnvironmentType } from '../../core/enums';
import { KwilSigner } from '../../core/kwilSigner';
import { BaseMessage, Message, MsgReceipt } from '../../core/message';
import { GenericResponse } from '../../core/resreq';
import { Kwil } from '../kwil';

export class WebKwil extends Kwil<EnvironmentType.BROWSER> {
  constructor(opts: Config) {
    super(opts);
  }

  /**
   * Calls a Kwil node. This can be used to execute read-only ('view') actions on Kwil.
   * If the action requires authentication in the Kwil Gateway, the kwilSigner should be passed. If the user is not authenticated, the user will be prompted to authenticate.
   *
   * @param {ActionBody} actionBody - The body of the action to send. This should use the `ActionBody` interface.
   * @param {KwilSigner} kwilSigner (optional) - Caller should be passed if the action requires authentication OR if the action uses a `@caller` contextual variable. If `@caller` is used and authentication is not required, the user will not be prompted to authenticate; however, the user's identifier will be passed as the sender.
   * @returns A promise that resolves to the receipt of the message.
   */
  public async call(
    actionBody: ActionBody,
    kwilSigner?: KwilSigner
  ): Promise<GenericResponse<MsgReceipt>>;

  /**
   * Calls a Kwil node. This can be used to execute read-only ('view') actions on Kwil.
   *
   * @param actionBody - The message to send. The message can be built using the ActionBuilder class.
   * @returns A promise that resolves to the receipt of the message.
   */
  public async call(actionBody: Message): Promise<GenericResponse<MsgReceipt>>;

  public async call(
    actionBody: Message | ActionBody,
    kwilSigner?: KwilSigner
  ): Promise<GenericResponse<MsgReceipt>> {
    if (actionBody instanceof BaseMessage) {
      return await this.client.call(actionBody);
    }

    let msg = ActionBuilderImpl.of<EnvironmentType.BROWSER>(this)
      .chainId(this.chainId)
      .dbid(actionBody.dbid)
      .name(actionBody.action)
      .description(actionBody.description || '');

    if (actionBody.inputs) {
      const inputs =
        actionBody.inputs[0] instanceof ActionInput
          ? (actionBody.inputs as ActionInput[])
          : new ActionInput().putFromObjects(actionBody.inputs as Entries[]);
      msg = msg.concat(inputs);
    }

    if (kwilSigner) {
      msg = msg
        .signer(kwilSigner.signer, kwilSigner.signatureType)
        .publicKey(kwilSigner.identifier);
    }

    const message = await msg.buildMsg();

    let res = await this.client.call(message);

    if(res.status === 401) {
      if (kwilSigner) {
        const authRes = await this.authenticate(kwilSigner);
        if(authRes.status === 200) {
          res = await this.client.call(message);
        }
      } else {
        throw new Error('Action requires authentication. Pass a KwilSigner to authenticate.')
      }
    }

    return res;
  }
}
