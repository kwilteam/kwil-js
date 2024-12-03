import { generateDBID } from '../utils/dbid';
import Client from '../api_client/client';
import { KwilConfig } from '../api_client/config';
import { GenericResponse } from '../core/resreq';
import { Database, DeployBody, DropBody, SelectQuery } from '../core/database';
import { BaseTransaction, TxReceipt } from '../core/tx';
import { Account, ChainInfo, ChainInfoOpts, DatasetInfo } from '../core/network';
import { DB } from '../db/db';
import { Cache } from '../utils/cache';
import { TxInfoReceipt } from '../core/txQuery';
import {
  AuthenticationMode,
  BroadcastSyncType,
  BytesEncodingStatus,
  EnvironmentType,
  PayloadType,
} from '../core/enums';
import { hexToBytes } from '../utils/serial';
import { isNearPubKey, nearB58ToHex } from '../utils/keys';
import { ActionBodyNode, ActionInput, Entries } from '../core/action';
import { KwilSigner } from '../core/kwilSigner';
import { wrap } from './intern';
import { Funder } from '../funder/funder';
import { Auth } from '../auth/auth';
import { Action } from '../action/action';
import { BaseMessage, Message, MsgReceipt } from '../core/message';
import { AuthBody, Signature } from '../core/signature';

/**
 * The main class for interacting with the Kwil network.
 */

export abstract class Kwil<T extends EnvironmentType> extends Client {
  protected readonly chainId: string;
  private readonly autoAuthenticate: boolean;

  //cache schemas
  private schemas: Cache<GenericResponse<Database>>;
  public funder: Funder<T>;
  public auth: Auth<T>;

  private authMode?: string; // To store the mode on the class for subsequent requests

  protected constructor(opts: KwilConfig) {
    super(opts);
    this.schemas = Cache.passive(opts.cache);

    // set chainId
    this.chainId = opts.chainId;

    this.autoAuthenticate = opts.autoAuthenticate !== undefined ? opts.autoAuthenticate : true;

    // create funder
    this.funder = new Funder<T>(
      this,
      {
        broadcastClient: this.broadcastClient.bind(this),
      },
      this.chainId
    );

    // create authenticate
    this.auth = new Auth<T>(
      {
        getAuthenticateClient: this.getAuthenticateClient.bind(this),
        postAuthenticateClient: this.postAuthenticateClient.bind(this),
        challengeClient: this.challengeClient.bind(this),
        logoutClient: this.logoutClient.bind(this),
      },
      this.config.kwilProvider,
      this.chainId
    );

    //create a wrapped symbol of estimateCost method
    wrap(this, this.estimateCostClient.bind(this));
  }

  /**
   * Generates a unique database identifier (DBID) from the provided owner's identifier (e.g. wallet address, public key, etc.) and a database name.
   *
   * @param owner - The owner's identifier (e.g wallet address, public key, etc.). Ethereum addresses can be passed as a hex string (0x123...) or as bytes (Uint8Array). NEAR protocol public keys can be passed as the base58 encoded public key (with "ed25519:" prefix), a hex string, or bytes (Uint8Array).
   * @param name - The name of the database. This should be a unique name to identify the database.
   * @returns A string that represents the unique identifier for the database.
   */

  public getDBID(owner: string | Uint8Array, name: string): string {
    return generateDBID(owner, name);
  }

  /**
   * Retrieves the schema of a database given its unique identifier (DBID).
   *
   * @param dbid - The unique identifier of the database. The DBID can be generated using the kwil.getDBID method.
   * @returns A promise that resolves to the schema of the database.
   */

  public async getSchema(dbid: string): Promise<GenericResponse<Database>> {
    // check cache
    const schema = this.schemas.get(dbid);
    if (schema) {
      return schema;
    }

    //fetch from server
    const res = await this.getSchemaClient(dbid);

    //cache result
    if (res.status === 200) {
      this.schemas.set(dbid, res);
    }

    return res;
  }

  /**
   * Retrieves an account using the owner's Ethereum wallet address.
   *
   * @param owner - The owner's identifier (e.g. Ethereum wallet address or NEAR public key). Ethereum addresses can be passed as a hex string (0x123...) or as bytes (Uint8Array). NEAR protocol public keys can be passed as the base58 encoded public key (with "ed25519:" prefix), a hex string, or bytes (Uint8Array).
   * @returns A promise that resolves to an Account object. The account object includes the owner's public key, balance, and nonce.
   */

  public async getAccount(owner: string | Uint8Array): Promise<GenericResponse<Account>> {
    if (typeof owner === 'string') {
      if (isNearPubKey(owner)) {
        owner = nearB58ToHex(owner);
      }

      owner = owner.toLowerCase();
      owner = hexToBytes(owner);
    }

    return await this.getAccountClient(owner);
  }

  /**
   * Broadcasts a transaction on the network.
   *
   * @param tx - The transaction to broadcast. The transaction can be built using the ActionBuilder or DBBuilder.
   * @returns A promise that resolves to the receipt of the transaction. The transaction receipt includes the transaction hash, fee, and body.
   * @deprecated Use `kwil.execute()` or `kwil.deploy()` instead. See: {@link https://github.com/kwilteam/kwil-js/issues/32}.
   */

  public async broadcast(
    tx: BaseTransaction<BytesEncodingStatus.BASE64_ENCODED>,
    sync?: BroadcastSyncType
  ): Promise<GenericResponse<TxReceipt>> {
    return await this.broadcastClient(tx, sync);
  }

  /**
   * Executes a transaction on a Kwil network. These are mutative actions that must be mined on the Kwil network's blockchain.
   *
   * @param actionBody - The body of the action to send. This should use the `ActionBodyNode` interface.
   * @param kwilSigner - The signer for the action transactions.
   * @param synchronous - (optional) If true, the broadcast will wait for the transaction to be mined before returning. If false, the broadcast will return the transaction hash immediately, regardless of if the transaction is successful. Defaults to false.
   * @returns A promise that resolves to the receipt of the transaction.
   */
  public async execute(
    actionBody: ActionBodyNode,
    kwilSigner: KwilSigner,
    synchronous?: boolean
  ): Promise<GenericResponse<TxReceipt>> {
    const name = !actionBody.name && actionBody.action ? actionBody.action : actionBody.name;

    let inputs;
    if (actionBody.inputs) {
      inputs = (actionBody.inputs as ActionInput[]).every(
        (item: ActionInput) => item instanceof ActionInput
      )
        ? (actionBody.inputs as ActionInput[])
        : new ActionInput().putFromObjects(actionBody.inputs as Entries[]);
    }

    let tx = Action.createTx(this, {
      dbid: actionBody.dbid,
      actionName: name.toLowerCase(),
      description: actionBody.description || '',
      identifier: kwilSigner.identifier,
      chainId: this.chainId,
      signer: kwilSigner.signer,
      signatureType: kwilSigner.signatureType,
      nonce: actionBody.nonce,
      actionInputs: inputs || [],
    });

    const transaction = await tx.buildTx();

    return await this.broadcastClient(
      transaction,
      synchronous ? BroadcastSyncType.COMMIT : undefined
    );
  }

  /**
   * Deploys a database to the Kwil network.
   *
   * @param deployBody - The body of the database to deploy. This should use the `DeployBody` interface.
   * @param kwilSigner - The signer for the database deployment.
   * @param synchronous - (optional) If true, the broadcast will wait for the transaction to be mined before returning. If false, the broadcast will return the transaction hash immediately, regardless of if the transaction is successful. Defaults to false.
   * @returns A promise that resolves to the receipt of the transaction.
   */
  public async deploy(
    deployBody: DeployBody,
    kwilSigner: KwilSigner,
    synchronous?: boolean
  ): Promise<GenericResponse<TxReceipt>> {
    let transaction = await DB.createTx(this, PayloadType.DEPLOY_DATABASE, {
      description: deployBody.description || '',
      payload: deployBody.schema,
      identifier: kwilSigner.identifier,
      signer: kwilSigner.signer,
      signatureType: kwilSigner.signatureType,
      chainId: this.chainId,
      nonce: deployBody.nonce,
    }).buildTx();

    return await this.broadcastClient(
      transaction,
      synchronous ? BroadcastSyncType.COMMIT : undefined
    );
  }

  /**
   * Drops a database from the Kwil network.
   *
   * @param dropBody - The body of the database to drop. This should use the `DropBody` interface.
   * @param kwilSigner - The signer for the database drop.
   * @param synchronous - (optional) If true, the broadcast will wait for the transaction to be mined before returning. If false, the broadcast will return the transaction hash immediately, regardless of if the transaction is successful. Defaults to false.
   * @returns A promise that resolves to the receipt of the transaction.
   */
  public async drop(
    dropBody: DropBody,
    kwilSigner: KwilSigner,
    synchronous?: boolean
  ): Promise<GenericResponse<TxReceipt>> {
    let transaction = await DB.createTx(this, PayloadType.DROP_DATABASE, {
      description: dropBody.description || '',
      payload: { dbid: dropBody.dbid },
      identifier: kwilSigner.identifier,
      signer: kwilSigner.signer,
      signatureType: kwilSigner.signatureType,
      chainId: this.chainId,
      nonce: dropBody.nonce,
    }).buildTx();

    return await this.broadcastClient(
      transaction,
      synchronous ? BroadcastSyncType.COMMIT : undefined
    );
  }

  /**
   * Lists all databases owned by a particular owner.
   *
   * @param owner (optional) - Lists the databases on a network. Can pass and owner identifier to see all the databases deployed by a specific account, or leave empty to see al the databases deployed on the network. The owner's public key (Ethereum or NEAR Protocol). Ethereum keys can be passed as a hex string (0x123...) or as bytes (Uint8Array).
   * @returns A promise that resolves to a list of database names.
   */

  public async listDatabases(owner?: string | Uint8Array): Promise<GenericResponse<DatasetInfo[]>> {
    if (typeof owner === 'string') {
      if (isNearPubKey(owner)) {
        owner = nearB58ToHex(owner);
      }

      owner = owner.toLowerCase();
      owner = hexToBytes(owner);
    }

    return await this.listDatabasesClient(owner);
  }

  /**
   * Performs a SELECT query on a database. The query must be a read-only query.
   *
   * @param dbid - The unique identifier of the database. The DBID can be generated using the kwil.getDBID method.
   * @param query - The SELECT query to execute.
   * @returns A promise that resolves to a list of objects resulting from the query.
   */

  public async selectQuery(dbid: string, query: string): Promise<GenericResponse<Object[]>> {
    const q: SelectQuery = {
      dbid: dbid,
      query: query,
    };

    return await this.selectQueryClient(q);
  }

  /**
   * Retrieves information about a transaction given its hash.
   *
   * @param hash - The `tx_hash` of the transaction.
   * @returns A promise that resolves to the transaction info receipt.
   */
  public async txInfo(hash: string): Promise<GenericResponse<TxInfoReceipt>> {
    return await this.txInfoClient(hash);
  }

  /**
   * Retrieves the chain id, block height, and latest block hash of the configured network.
   *
   * Will log a warning if the returned chain id does not match the configured chain id.
   *
   * @param {ChainInfoOpts} opts - Options for the chain info request.
   * @returns {ChainInfo} - A promise that resolves to the chain info.
   */
  public async chainInfo(opts?: ChainInfoOpts): Promise<GenericResponse<ChainInfo>> {
    const info = await this.chainInfoClient();

    if (!opts?.disableWarning && info.data?.chain_id !== this.chainId) {
      console.warn(
        `WARNING: Chain ID mismatch. Expected ${info.data?.chain_id}, got ${this.chainId}`
      );
    }

    return info;
  }

  /**
   * Pings the server and gets a response.
   *
   * @returns A promise that resolves to a string indicating the server's response.
   */
  public async ping(): Promise<GenericResponse<string>> {
    return await this.pingClient();
  }

  /**
   * Calls a Kwil node. This can be used to execute read-only ('view') actions on Kwil.
   *
   * @param {ActionBodyNode} actionBody - The message to send. The message can be built using the buildMsg() method in the Action class.
   * @param {KwilSigner} kwilSigner (optional) - KwilSigner should be passed if the action requires authentication OR if the action uses a `@caller` contextual variable. If `@caller` is used and authentication is not required, the user will not be prompted to authenticate; however, the user's identifier will be passed as the sender.
   * @param {(...args: any) => void} cookieHandlerCallback (optional) - the callback to handle the cookie if in the NODE environment
   * @returns A promise that resolves to the receipt of the message.
   */
  protected async baseCall(
    actionBody: Message | ActionBodyNode,
    kwilSigner?: KwilSigner,
    cookieHandlerCallback?: (...args: any) => void
  ): Promise<GenericResponse<MsgReceipt>> {
    // handle the cookie
    if (cookieHandlerCallback) {
      cookieHandlerCallback(actionBody, this.authMode);
    }

    // build and execute the call
    if (actionBody instanceof BaseMessage) {
      return await this.callClient(actionBody);
    }

    // Ensure auth mode is set
    await this.ensureAuthenticationMode();

    if (this.authMode === AuthenticationMode.OPEN) {
      const message = await this.buildMessage(actionBody, kwilSigner);
      const response = await this.callClient(message);
      if (response.authCode === -901) {
        await this.handleAuthenticateKGW(kwilSigner);
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

    throw new Error(
      'Unexpected authentication mode. If you hit this error, please report it to the Kwil team.'
    );
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
   * @param actionBody - The message to send. The message can be built using the buildMsg() method in the Action class.
   * @param kwilSigner (optional) - KwilSigner should be passed if the action requires authentication OR if the action uses a `@caller` contextual variable. If `@caller` is used and authentication is not required, the user will not be prompted to authenticate; however, the user's identifier will be passed as the sender.
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

    let inputs;
    if (actionBody.inputs) {
      inputs =
        actionBody.inputs[0] instanceof ActionInput
          ? (actionBody.inputs as ActionInput[])
          : new ActionInput().putFromObjects(actionBody.inputs as Entries[]);
    }

    // pre Challenge message
    let msg = Action.createTx<EnvironmentType.BROWSER>(this, {
      chainId: this.chainId,
      dbid: actionBody.dbid,
      actionName: name,
      description: actionBody.description || '',
      actionInputs: inputs || [],
    });

    /**
     * PUBLIC MODE
     * include the sender when the user passes a KwilSigner to kwil.call().
     * This is because the sender is required for queries that use @caller
     *
     */
    if (kwilSigner && this.authMode === AuthenticationMode.OPEN) {
      this.addSignerToMessage(msg, kwilSigner);
    }

    /**
     * PRIVATE MODE
     * include the sender when the user passes a KwilSigner to kwil.call().
     * only AFTER a challenge and signature is attached to the message
     *
     */
    if (kwilSigner && this.authMode === AuthenticationMode.PRIVATE) {
      if (challenge && signature) {
        // add challenge and signature to the message
        (msg.challenge = challenge),
          (msg.signature = signature),
          this.addSignerToMessage(msg, kwilSigner);
      }
    }

    return await msg.buildMsg();
  }

  /**
   * Adds a signer to the message
   *
   * @param msgBuilder - The Action class that handles the building of the message
   * @param kwilSigner - KwilSigner should be passed if the action requires authentication OR if the action uses a `@caller` contextual variable. If `@caller` is used and authentication is not required, the user will not be prompted to authenticate; however, the user's identifier will be passed as the sender.
   * @returns the Action class responsible for building the view action message with the sender attached
   *
   */
  private addSignerToMessage(
    msg: Action<EnvironmentType.BROWSER>,
    kwilSigner: KwilSigner
  ): Action<EnvironmentType.BROWSER> {
    (msg.signer = kwilSigner.signer),
      (msg.signatureType = kwilSigner.signatureType),
      (msg.identifier = kwilSigner.identifier);

    return msg;
  }

  /**
   * Checks authentication errors for PUBLIC (KGW)
   * Signs message and then retries request for successful response
   *
   * @param kwilSigner kwilSigner (optional) - KwilSigner should be passed if the action requires authentication OR if the action uses a `@caller` contextual variable. If `@caller` is used and authentication is not required, the user will not be prompted to authenticate; however, the user's identifier will be passed as the sender.
   * @returns
   */

  private async handleAuthenticateKGW(kwilSigner?: KwilSigner) {
    if (this.autoAuthenticate) {
      try {
        // KGW AUTHENTICATION
        if (!kwilSigner) {
          throw new Error('KGW authentication requires a KwilSigner.');
        }
        await this.auth.authenticateKGW(kwilSigner);
      } catch (error) {
        throw new Error(`Authentication failed: ${error}`);
      }
    }
  }

  /**
   * Checks authentication errors for PRIVATE mode
   * Signs message and then retries request for successful response
   *
   * @param {ActionBodyNode} actionBody - The message to send. The message can be built using the buildMsg() method in the Action class.
   * @param {KwilSigner} kwilSigner (optional) - KwilSigner should be passed if the action requires authentication OR if the action uses a `@caller` contextual variable. If `@caller` is used and authentication is not required, the user will not be prompted to authenticate; however, the user's identifier will be passed as the sender.
   * @returns the authentication body that consists of the challenge and signature required for PRIVATE mode
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

          return await this.auth.authenticatePrivateMode(actionBody, kwilSigner);
        }
      } catch (error) {
        throw new Error(`Authentication failed: ${error}`);
      }
    }

    throw new Error('Authentication process did not complete successfully');
  }
}
