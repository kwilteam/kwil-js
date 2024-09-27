import { Config } from '../../api_client/config';
import { ActionBuilderImpl } from '../../builders/action_builder';
import { ActionBody, ActionInput, Entries } from '../../core/action';
import { EnvironmentType } from '../../core/enums';
import { KwilSigner } from '../../core/kwilSigner';
import { BaseMessage, Message, MsgReceipt } from '../../core/message';
import { GenericResponse } from '../../core/resreq';
import { bytesToBase64 } from '../../utils/base64';
import { hexToBytes } from '../../utils/serial';
import { Kwil } from '../kwil';

export class WebKwil extends Kwil<EnvironmentType.BROWSER> {
  private readonly autoAuthenticate: boolean;

  constructor(opts: Config) {
    super(opts);

    this.autoAuthenticate = opts.autoAuthenticate !== undefined ? opts.autoAuthenticate : true;
  }

  /**
   * Calls a Kwil node. This can be used to execute read-only ('view') actions on Kwil.
   * If the action requires authentication in the Kwil Gateway, the kwilSigner should be passed. If the user is not authenticated, the user will be prompted to authenticate.
   *
   * @param {ActionBody} actionBody - The body of the action to send. This should use the `ActionBody` interface.
   * @param {KwilSigner} kwilSigner (optional) - KwilSigner should be passed if the action requires authentication OR if the action uses a `@caller` contextual variable. If `@caller` is used and authentication is not required, the user will not be prompted to authenticate; however, the user's identifier will be passed as the sender.
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
      return await this.callClient(actionBody);
    }

    const name = !actionBody.name && actionBody.action ? actionBody.action : actionBody.name;

    // pre Challenge message
    let msg1 = ActionBuilderImpl.of<EnvironmentType.BROWSER>(this)
      .chainId(this.chainId)
      .dbid(actionBody.dbid)
      .name(name)
      .description(actionBody.description || '');

    if (actionBody.inputs) {
      const inputs =
        actionBody.inputs[0] instanceof ActionInput
          ? (actionBody.inputs as ActionInput[])
          : new ActionInput().putFromObjects(actionBody.inputs as Entries[]);
      msg1 = msg1.concat(inputs);
    }

    if (kwilSigner) {
      msg1 = msg1
        .signer(kwilSigner.signer, kwilSigner.signatureType)
        .publicKey(kwilSigner.identifier);
    }

    // message without challenge
    let message = await msg1.buildMsg();
    // @ts-ignore
    delete message.data.sender;

    let res = await this.callClient(message);

    // Need to check authentication errors, sign message and retry request/response
    if (this.autoAuthenticate) {
      if (kwilSigner) {
        try {
          // KGW Authentication
          if (res.authCode === undefined) {
            const authRes = await this.auth.authenticate(kwilSigner);
            if (authRes.status === 200) {
              // call the message again
              res = await this.callClient(message);
            }
          }
          // Private Mode Authentication
          if (res.authCode === -1001 && message.body.payload) {
            const authPrivateModeRes = await this.auth.privateModeAuthenticate(
              kwilSigner,
              actionBody,
              message.body.payload
            );
            // message with signature to be passed
            msg1.challenge(authPrivateModeRes.challenge);
            msg1.signature(authPrivateModeRes.signature);
            message = await msg1.buildMsg();
            res = await this.callClient(message);
          }
        } catch (error) {
          console.error('Authentication failed:', error);
        }
      } else {
        throw new Error('Action requires authentication. Pass a KwilSigner to authenticate.');
      }
    }

    return res;
  }
}
