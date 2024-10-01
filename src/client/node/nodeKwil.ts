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

    // Set Temporary Cookie
    const tempCookie = this.setTemporaryCookie(actionBody);

    // Build Message
    const message = await this.buildMessage(actionBody, kwilSigner);

    // kwil.call()
    let response = await this.callClient(message);

    // Reset Cookie
    if (this.authMode === AuthenticationMode.OPEN) {
      this.resetCookie(tempCookie);
    }

    // Handle Authentication if error
    response = await this.handleAuthentication(response, message, actionBody, kwilSigner);

    return response;
  }

  /**
   * Check if authMode is already set, if not call healthModeCheckClient()
   * healthModeCheckClient => RPC call to retrieve health of blockchain and kwild mode (PRIVATE or OPEN (PUBLIC))
   *
   */
  private async ensureAuthenticationMode(): Promise<void> {
    if (!this.authMode) {
      const mode = await this.healthModeCheckClient();
      this.authMode = mode.data;
    }
  }

  /**
   * set the temp cookie so we can reset it after the call
   *
   * @param actionBody
   * @returns the temporary cookie to handle for Node
   * @returns undefined if in PRIVATE mode
   */
  private setTemporaryCookie(actionBody: ActionBodyNode): string | undefined {
    if (this.authMode === AuthenticationMode.OPEN && actionBody.cookie) {
      const tempCookie = this.cookie;
      this.cookie = actionBody.cookie;
      return tempCookie;
    }
    return undefined;
  }

  /**
   * Resets the temporary if in PUBLIC mode
   *
   * @param tempCookie
   */
  private resetCookie(tempCookie?: string): void {
    if (this.authMode === AuthenticationMode.OPEN && tempCookie) {
      this.cookie = tempCookie;
    }
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
   * Checks authentication errors for either PUBLIC (KGW) or PRIVATE mode
   * Signs message and then retries request for successful response
   *
   * @param response
   * @param message
   * @param actionBody
   * @param kwilSigner
   * @returns
   */
  private async handleAuthentication(
    response: CallClientResponse<MsgReceipt>,
    message: Message,
    actionBody: ActionBodyNode,
    kwilSigner?: KwilSigner
  ): Promise<CallClientResponse<MsgReceipt>> {
    if (this.autoAuthenticate && kwilSigner) {
      try {
        // KGW AUTHENTICATION
        if (response.authCode === -901) {
          const authRes = await this.auth.authenticateKGW(kwilSigner);
          if (authRes.status === 200 && this.authMode === AuthenticationMode.OPEN) {
            // set the cookie
            this.cookie = authRes.data?.cookie;
            // call the message again
            response = await this.callClient(message);
          }
        }

        // PRIVATE MODE AUTHENTICATION
        if (response.authCode === -1001 && message.body.payload) {
          const authPrivateModeRes = await this.auth.authenticatePrivateMode(
            kwilSigner,
            actionBody
          );
          message = await this.buildMessage(
            actionBody,
            kwilSigner,
            authPrivateModeRes.challenge,
            authPrivateModeRes.signature
          );

          response = await this.callClient(message);
        }
      } catch (error) {
        console.error('Authentication failed:', error);
      }
    } else if (!kwilSigner) {
      throw new Error('Action requires authentication. Pass a KwilSigner to authenticate');
    }

    return response;
  }
}
