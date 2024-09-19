import { Config } from '../../api_client/config';
import { ActionBuilderImpl } from '../../builders/action_builder';
import { ActionBody, ActionInput, Entries, ActionBodyNode } from '../../core/action';
import { EnvironmentType } from '../../core/enums';
import { KwilSigner } from '../../core/kwilSigner';
import { BaseMessage, Message, MsgReceipt } from '../../core/message';
import { GenericResponse } from '../../core/resreq';
import { Kwil } from '../kwil';

export class NodeKwil extends Kwil<EnvironmentType.NODE> {
  private autoAuthenticate: boolean;

  constructor(opts: Config) {
    super(opts);

    this.autoAuthenticate = opts.autoAuthenticate !== undefined ? opts.autoAuthenticate : true;
  }
  /**
   * Calls a Kwil node. This can be used to execute read-only ('view') actions on Kwil.
   * If the action requires authentication in the Kwil Gateway, the kwilSigner should be passed. If the user is not authenticated, the user will be prompted to authenticate.
   *
   * @param {ActionBodyNode} actionBody - The body of the action to send. This should use the `ActionBody` interface.
   * @param {KwilSigner} kwilSigner (optional) - KwilSigner should be passed if the action requires authentication OR if the action uses a `@caller` contextual variable. If `@caller` is used and authentication is not required, the user will not be prompted to authenticate; however, the user's identifier will be passed as the sender.
   * @returns A promise that resolves to the receipt of the message.
   */
  public async call(
    actionBody: ActionBodyNode,
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
    actionBody: Message | ActionBodyNode,
    kwilSigner?: KwilSigner
  ): Promise<GenericResponse<MsgReceipt>> {
    if (actionBody instanceof BaseMessage) {
      return await this.callClient(actionBody);
    }

    let tempCookie: string | undefined;

    if (actionBody.cookie) {
      // set the temp cookie so we can reset it after the call
      tempCookie = this.cookie;
      this.cookie = actionBody.cookie;
    }

    const name = !actionBody.name && actionBody.action ? actionBody.action : actionBody.name;

    let msg = ActionBuilderImpl.of<EnvironmentType.NODE>(this)
      .chainId(this.chainId)
      .dbid(actionBody.dbid)
      .name(name)
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

    let res = await this.callClient(message);

    // reset the cookie
    if (tempCookie) {
      this.cookie = tempCookie;
    }

    // Need to decide what the error code is (KGW or Private Mode) after request is made by user (View or Read Actions)
    // If kwild (Private) auth error code =>
      // kwild auth flow and then retry the request & handle cookies
        // remember that they are talking to kwild node in private mode so all subsequent requests include kwild auth flow
    // if kgw (Gateway) auth error code =>
      // kgw auth flow and retry request & handle cookies

    // if we get a 401, we need to return the response so we can try to authenticate
    if (this.autoAuthenticate && res.status === 401) {
      if (kwilSigner) {
        const authRes = await this.auth.authenticate(kwilSigner);
        if (authRes.status === 200) {
          // set the cookie
          this.cookie = authRes.data?.cookie;

          // call the message again
          res = await this.callClient(message);
        }
      } else {
        throw new Error('Action requires authentication. Pass a KwilSigner to authenticate.');
      }
    }

    return res;
  }
}
