import { Config } from '../../api_client/config';
import { ActionBuilderImpl } from '../../builders/action_builder';
import { ActionBody, ActionBodyNode, ActionInput, Entries } from '../../core/action';
import { ActionBuilder } from '../../core/builders';
import { AuthenticationMode, BytesEncodingStatus, EnvironmentType } from '../../core/enums';
import { KwilSigner } from '../../core/kwilSigner';
import { BaseMessage, Message, MsgReceipt } from '../../core/message';
import { GenericResponse } from '../../core/resreq';
import { AuthBody, Signature } from '../../core/signature';
import { Kwil } from '../kwil';

export class WebKwil extends Kwil<EnvironmentType.BROWSER> {
  private readonly autoAuthenticate: boolean;
  private authMode?: string; // To store the mode on the class for subsequent requests

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

    // Ensure auth mode is set
    await this.ensureAuthenticationMode();

    if (this.authMode === AuthenticationMode.OPEN) {
      const message = await this.buildMessage(actionBody, kwilSigner);
      const response = await this.callClient(message);
      if (response.authCode === -901) {
        await this.handleAuthenticateKGW(kwilSigner)
        return await this.callClient(message);
      }
      return response;
    } else if (this.authMode === AuthenticationMode.PRIVATE) {
      const authBody = await this.handleAuthenticatePrivate(actionBody, kwilSigner);
      const message = await this.buildMessage(
        actionBody,
        kwilSigner,
        authBody.challenge,
        authBody.signature
      );
      return await this.callClient(message);
    }

    throw new Error("Unexpected authentication mode. If you hit this error, please report it to the Kwil team.");
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
    let msgBuilder = ActionBuilderImpl.of<EnvironmentType.BROWSER>(this)
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
    if (this.autoAuthenticate) {
      try {
        // KGW AUTHENTICATION
          if (!kwilSigner) {
            throw new Error('KGW authentication requires a KwilSigner.');
          }
          await this.auth.authenticateKGW(kwilSigner);
      } catch (error) {
        throw  new Error(`Authentication failed: ${error}`)
      }
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
  ): Promise<AuthBody> {
    if (this.autoAuthenticate) {
      try {
        // PRIVATE MODE AUTHENTICATION
        if (this.authMode === AuthenticationMode.PRIVATE) {
          if (!kwilSigner) {
            throw new Error('Private mode authentication requires a KwilSigner.');
          }

          return await this.auth.authenticatePrivateMode(
            actionBody,
            kwilSigner
          );
        }
      } catch (error) {
        throw  new Error(`Authentication failed: ${error}`)
      }
    }

    throw new Error('Authentication process did not complete successfully')
  }
}
