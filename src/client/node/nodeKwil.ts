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
  private privateMode: boolean;

  constructor(opts: Config) {
    super(opts);

    this.autoAuthenticate = opts.autoAuthenticate !== undefined ? opts.autoAuthenticate : true;
    this.privateMode = false;
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

    // Private or KGW
    const mode = await this.healthModeCheck();

    if (mode.data === 'private') {
      this.privateMode = true;
    }

    const challenge = await this.challengeClient();
    let msgChallenge = challenge.data as string;

    let tempCookie: string | undefined;
    if (!this.privateMode) {
      if (actionBody.cookie) {
        // set the temp cookie so we can reset it after the call
        tempCookie = this.cookie;
        this.cookie = actionBody.cookie;
      }
    }

    const name = !actionBody.name && actionBody.action ? actionBody.action : actionBody.name;

    // pre Challenge message
    let msg1 = ActionBuilderImpl.of<EnvironmentType.NODE>(this)
      .chainId(this.chainId)
      .dbid(actionBody.dbid)
      .name(name)
      .description(actionBody.description || '');
    // put signature from privateModeAuth

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
    const message = await msg1.buildMsg();

    let res = await this.callClient(message, this.autoAuthenticate);

    if (!this.privateMode) {
      // reset the cookie
      if (tempCookie) {
        this.cookie = tempCookie;
      }
    }

    // if (kwilSigner && message.body.payload) {
    //   const authPrivateModeRes = await this.auth.privateModeAuthenticate(
    //     kwilSigner,
    //     actionBody,
    //     msgChallenge,
    //     message.body.payload
    //   );
    //   console.log(authPrivateModeRes)
    // }

    // Need to check authentication errors, sign message and retry request/response
    if (this.autoAuthenticate) {
      if (kwilSigner) {
        try {
          // KGW Authentication
          if (res.authCode === undefined) {
            const authRes = await this.auth.authenticate(kwilSigner);
            if (authRes.status === 200) {
              if (!this.privateMode) {
                // set the cookie
                this.cookie = authRes.data?.cookie;
              }
              // call the message again
              res = await this.callClient(message);
            }
          }
          // Private Mode Authentication
          if (res.authCode === -1001 && message.body.payload) {
            console.log("You")
            const authPrivateModeRes = await this.auth.privateModeAuthenticate(
              kwilSigner,
              actionBody,
              msgChallenge,
              message.body.payload
            );
            console.log("Yo")
              // message with signature to be passed
              msg1.challenge(authPrivateModeRes)
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
