import { Config } from '../../api_client/config';
import { ActionBuilderImpl } from '../../builders/action_builder';
import { ActionInput, Entries, ActionBodyNode } from '../../core/action';
import { ActionBuilder } from '../../core/builders';
import { AuthenticationMode, BytesEncodingStatus, EnvironmentType } from '../../core/enums';
import { KwilSigner } from '../../core/kwilSigner';
import { BaseMessage, CallClientResponse, Message, MsgReceipt } from '../../core/message';
import { GenericResponse } from '../../core/resreq';
import { Kwil } from '../kwil';
import { Signature } from '../../core/signature';

export class NodeKwil extends Kwil<EnvironmentType.NODE> {
  private autoAuthenticate: boolean;
  private authMode?: string; // To store the mode on the class for subsequent requests

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

    // Ensure auth mode is set
    await this.ensureAuthenticationMode();

    // kwil.call()
    if (this.authMode === AuthenticationMode.OPEN) {
      const tempCookie = this.setTemporaryCookie(actionBody?.cookie)
      const message = await this.buildMessage(actionBody, kwilSigner);
      const response = await this.callClient(message);
      if (tempCookie) {
        this.resetTempCookie(tempCookie)
      }
      if (response.authCode === -901 && this.autoAuthenticate) {
        await this.handleAuthenticateKGW(kwilSigner)
        return await this.callClient(message);
      }
      return response;
    } else if (this.authMode === AuthenticationMode.PRIVATE) {
      return await this.handleAuthenticatePrivate(actionBody, kwilSigner)
    }

    throw new Error("Unexpected authentication mode or action body type.");
  }

  /**
   * Check if authMode is already set, if not call healthModeCheckClient()
   * healthModeCheckClient => RPC call to retrieve health of blockchain and kwild mode (PRIVATE or OPEN (PUBLIC))
   *
   */
  private async ensureAuthenticationMode(): Promise<void> {
    if (!this.authMode) {
      const health = await this.healthModeCheckClient();
      this.authMode = health.data?.mode;
    }
  }

  /**
   * set the temp cookie so we can reset it after the call
   *
   * @param actionBody
   * @returns the temporary cookie to handle for Node
   * @returns undefined if in PRIVATE mode
   */
  private setTemporaryCookie(cookie?: string): string | undefined {
    if (this.authMode === AuthenticationMode.OPEN && cookie) {
      const tempCookie = this.cookie;
      this.cookie = cookie;
      return tempCookie;
    }
    return undefined;
  }

  /**
   * Resets the temporary cookie
   *
   * @param tempCookie
   */
  private resetTempCookie(tempCookie: string): void {
    this.cookie = tempCookie;
  }

  /**
   * Builds a message with a chainId, dbid, name, and description of the action.
   * NOT INCLUDED => challenge, sender, signature
   *
   * @param actionBody
   * @param kwilSigner
   * @param challenge (optional) - To ensure a challenge is passed into the message before the signer in PRIVATE mode
   * @param signature (optional) - To ensure a signature is passed into the message before the signer in PRIVATE mode
   * @returns A message object that can be sent to the Kwil network.
   * @throws — Will throw an error if the action is being built or if there's an issue with the schema or account retrieval.
   * @throws — Will throw an error if the action is not a view action.
   */
  private async buildMessage(
    actionBody: ActionBodyNode,
    kwilSigner?: KwilSigner,
    challenge?: string,
    signature?: Signature<BytesEncodingStatus.BASE64_ENCODED>
  ): Promise<Message> {
    const name = !actionBody.name && actionBody.action ? actionBody.action : actionBody.name;

    // pre Challenge message
    let msgBuilder = ActionBuilderImpl.of<EnvironmentType.NODE>(this)
      .chainId(this.chainId)
      .dbid(actionBody.dbid)
      .name(name)
      .description(actionBody.description || '');

    if (actionBody.inputs) {
      const inputs =
        actionBody.inputs[0] instanceof ActionInput
          ? (actionBody.inputs as ActionInput[])
          : new ActionInput().putFromObjects(actionBody.inputs as Entries[]);
      msgBuilder = msgBuilder.concat(inputs);
    }

    /**
     * PUBLIC MODE
     * include the sender when the user passes a KwilSigner to kwil.call().
     * This is because the sender is required for queries that use @caller
     *
     */
    if (kwilSigner && this.authMode === AuthenticationMode.OPEN) {
      msgBuilder = this.addSignerToMessage(msgBuilder, kwilSigner);
    }

    /**
     * PRIVATE MODE
     * include the sender when the user passes a KwilSigner to kwil.call().
     * only AFTER a challenge and signature is attached to the message
     *
     */
    if (kwilSigner && this.authMode === AuthenticationMode.PRIVATE) {
      if (challenge && signature) {
        msgBuilder.challenge(challenge).signature(signature);
        msgBuilder = this.addSignerToMessage(msgBuilder, kwilSigner);
      }
    }

    return await msgBuilder.buildMsg();
  }

  /**
   * Adds a signer to the message
   *
   * @param msgBuilder
   * @param kwilSigner
   * @returns the ActionBuilder responsible for building the view action message with the sender attached
   *
   */
  private addSignerToMessage(msgBuilder: ActionBuilder, kwilSigner: KwilSigner): ActionBuilder {
    return msgBuilder
      .signer(kwilSigner.signer, kwilSigner.signatureType)
      .publicKey(kwilSigner.identifier);
  }

  /**
   * Checks authentication errors for PUBLIC (KGW)
   * Signs message and then retries request for successful response
   *
   * @param response
   * @param message
   * @param kwilSigner
   * @returns
   */

  private async handleAuthenticateKGW(
    kwilSigner?: KwilSigner
  ) {
    try {
      // KGW AUTHENTICATION
      if (!kwilSigner) {
        throw new Error('KGW authentication requires a KwilSigner.');
      }

      // set the cookie
      const res = await this.auth.authenticateKGW(kwilSigner)
      this.cookie = res.data?.cookie
    } catch (error) {
      throw new Error(`Authentication failed: ${error}`)
    }
  }

  /**
   * Checks authentication errors for PRIVATE mode
   * Signs message and then retries request for successful response
   *
   * @param actionBody
   * @param kwilSigner
   * @returns
   */

  private async handleAuthenticatePrivate(
    actionBody: ActionBodyNode,
    kwilSigner?: KwilSigner
  ): Promise<CallClientResponse<MsgReceipt>> {
    if (this.autoAuthenticate) {
      try {
        // PRIVATE MODE AUTHENTICATION
        if (this.authMode === AuthenticationMode.PRIVATE) {
          if (!kwilSigner) {
            throw new Error('Private mode authentication requires a KwilSigner.');
          }

          const authPrivateModeRes = await this.auth.authenticatePrivateMode(
            actionBody,
            kwilSigner
          );
          const message = await this.buildMessage(
            actionBody,
            kwilSigner,
            authPrivateModeRes.challenge,
            authPrivateModeRes.signature
          );

          return await this.callClient(message);
        }
      } catch (error) {
        throw new Error(`Authentication failed: ${error}`);
      }
    }

    throw new Error('Authentication process did not complete successfully')
  }
}
