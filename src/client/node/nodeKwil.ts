import { Config } from '../../api_client/config';
import { ActionBodyNode } from '../../core/action';
import { AuthenticationMode, EnvironmentType } from '../../core/enums';
import { KwilSigner } from '../../core/kwilSigner';
import { MsgReceipt } from '../../core/message';
import { GenericResponse } from '../../core/resreq';
import { Kwil } from '../kwil';

export class NodeKwil extends Kwil<EnvironmentType.NODE> {
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
  ): Promise<GenericResponse<MsgReceipt>>;

  public async call(
    actionBody: ActionBodyNode,
    kwilSigner?: KwilSigner
  ): Promise<GenericResponse<MsgReceipt>> {
    const cookieHandler = (body: ActionBodyNode, authMode: AuthenticationMode) => {
      // handle cookie if in PUBLIC mode
      if (authMode === AuthenticationMode.OPEN && body.cookie) {
        // set the temporary cookie
        const tempCookie = this.setTemporaryCookie(body.cookie);
        // reset the temporary cookie
        if (tempCookie) {
          this.resetTempCookie(tempCookie);
        }
      }
    };

    return await this.baseCall(actionBody, kwilSigner, cookieHandler);
  }

  /**
   * set the temp cookie to reset it after the call
   *
   * @param {string} cookie - The temporary cookie
   * @returns the temporary cookie to handle for Node
   */
  private setTemporaryCookie(cookie?: string): string | undefined {
    const tempCookie = this.cookie;
    this.cookie = cookie;
    return tempCookie;
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
