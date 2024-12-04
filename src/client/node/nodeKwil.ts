import { Config } from '../../api_client/config';
import { ActionBodyNode } from '../../core/action';
import { AuthenticationMode, EnvironmentType } from '../../core/enums';
import { KwilSigner } from '../../core/kwilSigner';
import { Message, MsgReceipt } from '../../core/message';
import { GenericResponse } from '../../core/resreq';
import { Kwil } from '../kwil';

export class NodeKwil extends Kwil<EnvironmentType.NODE> {
  private tempCookie: string | undefined;

  constructor(opts: Config) {
    super(opts);
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
  ): Promise<GenericResponse<MsgReceipt>> {
    let tempCookie: string | undefined;

    const setCookie = () => {
        // set the temporary cookie, if the user provided one
        if (actionBody.cookie) {
          this.setTemporaryCookie(actionBody.cookie);
        }
    };

    const resetCookie = () => {
        // after the user makes the request, we need to reset the cookie to what it was before
        // when manually passing cookies, the user is expected to pass the cookie for each request
        // if a user does not pass a cookie for a subsequent request, the cookie will be reset to the original cookie
        if (tempCookie) {
          this.resetTempCookie(tempCookie);
        }
    }

    const cookieHandler = {
      setCookie,
      resetCookie,
    }

    return await this.baseCall(actionBody, kwilSigner, cookieHandler);
  }

  /**
   * set the temp cookie to reset it after the call
   *
   * @param {string} cookie - The temporary cookie
   * @returns the temporary cookie to handle for Node
   */
  private setTemporaryCookie(cookie: string): void {
    this.tempCookie = this.cookie;
    this.cookie = cookie;
  }

  /**
   * Resets the temporary cookie
   *
   * @param {string} tempCookie - the temporary cookie to be reset
   */
  private resetTempCookie(tempCookie: string): void {
    this.cookie = tempCookie;
  }
}
