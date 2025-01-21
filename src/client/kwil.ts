import Client from '../api_client/client';
import { KwilConfig } from '../api_client/config';
import { GenericResponse } from '../core/resreq';
import { Database, DeployBody, DropBody, SelectQuery } from '../core/database';
import { TxReceipt } from '../core/tx';
import { Account, ChainInfo, ChainInfoOpts, DatasetInfo } from '../core/network';
import { Cache } from '../utils/cache';
import { TxInfoReceipt } from '../core/txQuery';
import {
  AccountKeyType,
  AuthenticationMode,
  AuthErrorCodes,
  BroadcastSyncType,
  BytesEncodingStatus,
  EnvironmentType,
  ValueType,
} from '../core/enums';
import { hexToBytes } from '../utils/serial';
import { isNearPubKey, nearB58ToHex } from '../utils/keys';
import { ActionBody, ActionInput, CallBody, Entries, transformActionInput } from '../core/action';
import { KwilSigner } from '../core/kwilSigner';
import { wrap } from './intern';
import { Funder } from '../funder/funder';
import { Auth } from '../auth/auth';
import { Action } from '../transaction/action';
import { Message, MsgReceipt } from '../core/message';
import { AuthBody, Signature } from '../core/signature';
import { SelectQueryRequest } from '../core/jsonrpc';
import { formatParameters } from '../utils/parameters';
import { generateDBID } from '../utils/dbid';

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

    this.autoAuthenticate = opts.autoAuthenticate || true;

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
   * @deprecated DBID's are no longer in use.  This method will be removed in the next major version.
   * @returns A string that represents the unique identifier for the database.
   */

  public getDBID(owner: string | Uint8Array, name: string): string {
    return generateDBID(owner, name);
  }

  /**
   * Retrieves the schema of a database given its unique identifier (DBID).
   *
   * @param dbid - The unique identifier of the database. The DBID can be generated using the kwil.getDBID method.
   * @deprecated Use `kwil.selectQuery(query, params?, signer?)` instead. This method will be removed in the next major version.
   * @returns A promise that resolves to the schema of the database.
   */
  // TODO: Improve deprecation message with examples
  public async getSchema(dbid: string): Promise<GenericResponse<Database>> {
    console.warn(
      'WARNING: `getSchema()` is deprecated and will be removed in the next major version. Please use `kwil.selectQuery()` instead.'
    );
    throw new Error(
      'The `getSchema()` method is no longer supported. Please use `kwil.selectQuery(query, params?, signer?)` instead.'
    );
  }

  /**
   * Retrieves the tables in a database given its namespace.
   *
   * @param namespace - The namespace of the tables to retrieve.
   * @returns A promise that resolves to the tables in the database.
   */
  public async getTables(namespace: string): Promise<GenericResponse<Object[]>> {
    if (!this.validateNamespace(namespace)) {
      throw new Error('Please provide a valid namespace');
    }

    return await this.selectQuery('SELECT * FROM info.tables WHERE namespace = $namespace', {
      $namespace: namespace,
    });
  }

  /**
   * Retrieves the tables in a database given its namespace.
   *
   * @param namespace - The namespace of the tables to retrieve.
   * @returns A promise that resolves to the tables in the database.
   */
  public async getTableColumns(
    namespace: string,
    table: string
  ): Promise<GenericResponse<Object[]>> {
    if (!this.validateNamespace(namespace)) {
      throw new Error('Please provide a valid namespace');
    }

    return await this.selectQuery(
      'SELECT * FROM info.columns WHERE namespace = $namespace and table_name = $table',
      {
        $namespace: namespace,
        $table: table,
      }
    );
  }

  /**
   * Retrieves the actions in a database given its namespace.
   *
   * @param namespace - The namespace of the actions to retrieve.
   * @returns A promise that resolves to the actions in the database.
   */
  public async getActions(namespace: string): Promise<GenericResponse<Object[]>> {
    if (!this.validateNamespace(namespace)) {
      throw new Error('Please provide a valid namespace');
    }

    return await this.selectQuery('SELECT * FROM info.actions WHERE namespace = $namespace', {
      $namespace: namespace,
    });
  }

  /**
   * Retrieves the extensions in a database given its namespace.
   *
   * @param namespace - The namespace of the extensions to retrieve.
   * @returns A promise that resolves to the extensions in the database.
   */
  public async getExtensions(namespace: string): Promise<GenericResponse<Object[]>> {
    if (!this.validateNamespace(namespace)) {
      throw new Error('Please provide a valid namespace');
    }

    return await this.selectQuery('SELECT * FROM info.extensions WHERE namespace = $namespace', {
      $namespace: namespace,
    });
  }

  /**
   * Retrieves an account using the owner's Ethereum wallet address.
   *
   * @param owner - The owner's identifier (e.g. Ethereum wallet address or NEAR public key). Ethereum addresses can be passed as a hex string (0x123...) or as bytes (Uint8Array). NEAR protocol public keys can be passed as the base58 encoded public key (with "ed25519:" prefix), a hex string, or bytes (Uint8Array).
   * @returns A promise that resolves to an Account object. The account object includes the owner's public key, balance, and nonce.
   */

  public async getAccount(owner: string | Uint8Array): Promise<GenericResponse<Account>> {
    let keyType = AccountKeyType.SECP256K1;
    if (typeof owner === 'string') {
      if (isNearPubKey(owner)) {
        owner = nearB58ToHex(owner);
        keyType = AccountKeyType.ED25519;
      }

      owner = owner.toLowerCase();
      owner = hexToBytes(owner);
    }

    return await this.getAccountClient(owner, keyType);
  }

  /**
   * Executes a transaction on a Kwil network. These are mutative actions that must be mined on the Kwil network's blockchain.
   *
   * @param actionBody - The body of the action to send. This should use the `ActionBody` interface.
   * @param kwilSigner - The signer for the action transactions.
   * @param synchronous - (optional) If true, the broadcast will wait for the transaction to be mined before returning. If false, the broadcast will return the transaction hash immediately, regardless of if the transaction is successful. Defaults to false.
   * @returns A promise that resolves to the receipt of the transaction.
   */
  public async execute(
    actionBody: ActionBody,
    kwilSigner: KwilSigner,
    synchronous?: boolean
  ): Promise<GenericResponse<TxReceipt>> {
    if (!actionBody.name) {
      throw new Error('name is required in actionBody');
    }

    // ActionInput[] has been deprecated.
    // This transforms the ActionInput[] into Entries[] to support legacy ActionInput[]
    let inputs: Entries[] = [];
    if (actionBody.inputs && transformActionInput.isActionInputArray(actionBody.inputs)) {
      inputs = transformActionInput.toEntries(actionBody.inputs);
    }

    let tx = Action.createTx(this, {
      namespace: actionBody.namespace,
      actionName: actionBody.name.toLowerCase(),
      description: actionBody.description || '',
      identifier: kwilSigner.identifier,
      chainId: this.chainId,
      signer: kwilSigner.signer,
      signatureType: kwilSigner.signatureType,
      nonce: actionBody.nonce,
      actionInputs: inputs,
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
   * @deprecated Use `kwil.query()` instead. This method will be removed in the next major version.
   * @returns A promise that resolves to the receipt of the transaction.
   */
  public async deploy(
    deployBody: DeployBody,
    kwilSigner: KwilSigner,
    synchronous?: boolean
  ): Promise<GenericResponse<TxReceipt>> {
    console.warn(
      'WARNING: `deploy()` is deprecated and will be removed in the next major version. Please use `kwil.query()` instead.'
    );
    throw new Error(
      'The `deploy()` method is no longer supported. Please use `kwil.query()` instead.'
    );
  }

  /**
   * Drops a database from the Kwil network.
   *
   * @param dropBody - The body of the database to drop. This should use the `DropBody` interface.
   * @param kwilSigner - The signer for the database drop.
   * @param synchronous - (optional) If true, the broadcast will wait for the transaction to be mined before returning. If false, the broadcast will return the transaction hash immediately, regardless of if the transaction is successful. Defaults to false.
   * @deprecated Use `kwil.query()` instead. This method will be removed in the next major version.
   * @returns A promise that resolves to the receipt of the transaction.
   */
  public async drop(
    dropBody: DropBody,
    kwilSigner: KwilSigner,
    synchronous?: boolean
  ): Promise<GenericResponse<TxReceipt>> {
    console.warn(
      'WARNING: `drop()` is deprecated and will be removed in the next major version. Please use `kwil.query()` instead.'
    );
    throw new Error(
      'The `drop()` method is no longer supported. Please use `kwil.query()` instead.'
    );
  }

  /**
   * Lists all databases owned by a particular owner.
   *
   * @param owner (optional) - Lists the databases on a network. Can pass and owner identifier to see all the databases deployed by a specific account, or leave empty to see al the databases deployed on the network. The owner's public key (Ethereum or NEAR Protocol). Ethereum keys can be passed as a hex string (0x123...) or as bytes (Uint8Array).
   * @deprecated Use `kwil.selectQuery(query, params?, signer?)` instead. This method will be removed in the next major version.
   * @returns A promise that resolves to a list of database names.
   */

  public async listDatabases(owner?: string | Uint8Array): Promise<GenericResponse<DatasetInfo[]>> {
    console.warn(
      'WARNING: `listDatabases()` is deprecated and will be removed in the next major version. Please use `kwil.selectQuery(query, params?, signer?)` instead.'
    );
    throw new Error(
      'The `listDatabases()` method is no longer supported. Please use `kwil.selectQuery(query, params?, signer?)` instead.'
    );
  }

  /**
   * Performs a read-only SELECT query on a database.
   * This operation does not modify state.
   *
   * @param query - The SELECT query to execute
   * @param params - Optional array of parameters to bind to the query ($1, $2, etc.)
   * @param signer - Optional signer for authenticated queries
   * @returns Promise resolving to query results
   */
  public async selectQuery(
    query: string,
    params?: Record<string, ValueType>,
    signer?: KwilSigner
  ): Promise<GenericResponse<Object[]>>;
  /**
   * @deprecated Use selectQuery(query, params?, signer?) instead. This method will be removed in next major version.
   */
  public async selectQuery(dbid: string, query: string): Promise<GenericResponse<Object[]>>;
  public async selectQuery(
    query: string,
    params?: Record<string, ValueType> | string,
    kwilSigner?: KwilSigner
  ): Promise<GenericResponse<Object[]>> {
    // If params is a string, we're using the legacy method call
    if (typeof params === 'string') {
      return this.legacySelectQuery(query, params);
    }

    const formattedParams = formatParameters(params || {});

    const q: SelectQueryRequest = {
      query,
      params: formattedParams,
    };

    // TODO: Add support for signer

    return await this.selectQueryClient(q);
  }

  private async legacySelectQuery(dbid: string, query: string): Promise<GenericResponse<Object[]>> {
    console.warn(
      'WARNING: selectQuery(dbid, query) is deprecated and will be removed in the next major version. Use selectQuery(query, params?, signer?) instead.'
    );

    const q: SelectQueryRequest = {
      query: `{${dbid}}${query}`, // Append the dbid to the query to set the namespace
      params: {},
    };

    return await this.selectQueryClient(q);
  }

  /**
   * Executes a mutative SQL query (INSERT, UPDATE, DELETE) on a database.
   *
   * @param query - The SQL query to execute, including the database identifier in curly braces.
   *               Use parameterized queries with @paramName placeholders for better security (recommended):
   *               '{dbname}INSERT INTO users (name) VALUES (@name)'
   *
   *               Raw queries are possible but discouraged:
   *               '{dbname}INSERT INTO users (name) VALUES ('john')'
   *
   * @param params - Object containing named parameters to bind to the query. Parameters are referenced
   *                using @paramName syntax in the query.
   * @param kwilSigner - Required signer for executing mutative queries
   * @param synchronous - (optional) If true, waits for transaction to be mined
   *
   * @example
   * // Insert with parameters
   * await kwil.query(
   *   '{mydb}INSERT INTO users (name, email) VALUES (@name, @email)',
   *   { name: 'John', email: 'john@example.com' },
   *   signer
   * );
   *
   * // Update with parameters
   * await kwil.query(
   *   '{mydb}UPDATE users SET status = @status WHERE id = @id',
   *   { status: 'active', id: 123 },
   *   signer
   * );
   *
   * // Delete with parameters
   * await kwil.query(
   *   '{mydb}DELETE FROM users WHERE id = @id',
   *   { id: 123 },
   *   signer
   * );
   *
   * @returns Promise resolving to transaction receipt
   */
  // public async query(
  //   query: string,
  //   params: Record<string, ValueType>,
  //   kwilSigner: KwilSigner,
  //   synchronous?: boolean
  // ): Promise<GenericResponse<TxReceipt>> {
  //   // TODO: Add support for signer
  //   // TODO: Add support for synchronous

  //   console.log('query', query);
  //   console.log('params', params);
  //   console.log('kwilSigner', kwilSigner);
  //   console.log('synchronous', synchronous);

  //   const q: QueryRequest = {
  //     query,
  //     params: params || {},
  //   };

  //   // Add signer information if provided
  //   if (kwilSigner) {
  //     // q.identifier = kwilSigner.identifier;
  //     // q.signatureType = kwilSigner.signatureType;
  //     // Add any other necessary signer info
  //   }

  //   // return await this.queryClient(q);
  // }

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
   * @param {CallBody} callBody - The message to send. The message can be built using the buildMsg() method in the Action class.
   * @param {KwilSigner} kwilSigner (optional) - KwilSigner should be passed if the action requires authentication OR if the action uses a `@caller` contextual variable. If `@caller` is used and authentication is not required, the user will not be prompted to authenticate; however, the user's identifier will be passed as the sender.
   * @param {(...args: any) => void} cookieHandlerCallback (optional) - the callback to handle the cookie if in the NODE environment
   * @returns A promise that resolves to the receipt of the message.
   */
  protected async baseCall(
    actionBody: CallBody,
    kwilSigner?: KwilSigner,
    cookieHandlerCallback?: { setCookie: () => void; resetCookie: () => void }
  ): Promise<GenericResponse<Object[] | MsgReceipt>> {
    // Ensure auth mode is set
    await this.ensureAuthenticationMode();

    if (this.authMode === AuthenticationMode.OPEN) {
      // if nodeJS user passes a cookie, use it for the call
      if (cookieHandlerCallback) {
        cookieHandlerCallback.setCookie();
      }
      const message = await this.buildMessage(actionBody, kwilSigner);
      const response = await this.callClient(message);

      // if nodeJS user passes a cookie, reset it after the call
      if (cookieHandlerCallback) {
        cookieHandlerCallback.resetCookie();
      }

      // if the user is not authenticated, prompt the user to authenticate
      if (response.authCode === AuthErrorCodes.KGW_MODE && this.autoAuthenticate) {
        await this.handleAuthenticateKGW(kwilSigner);
        return await this.callClient(message);
      }
      return response;
    }
    if (this.authMode === AuthenticationMode.PRIVATE) {
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
   * Builds a message with a chainId, namespace, name, and description of the action.
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
    actionBody: ActionBody,
    kwilSigner?: KwilSigner,
    challenge?: string,
    signature?: Signature<BytesEncodingStatus.BASE64_ENCODED>
  ): Promise<Message> {
    if (!actionBody.name) {
      throw new Error('name is required in actionBody');
    }

    let inputs: Entries[] = [];
    if (actionBody.inputs && transformActionInput.isActionInputArray(actionBody.inputs)) {
      inputs = transformActionInput.toSingleEntry(actionBody.inputs);
    } else if (actionBody.inputs) {
      inputs = actionBody.inputs;
    }

    // pre Challenge message
    let msg = Action.createTx<EnvironmentType.BROWSER>(this, {
      chainId: this.chainId,
      namespace: actionBody.namespace,
      actionName: actionBody.name,
      description: actionBody.description || '',
      actionInputs: inputs,
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
        msg.challenge = challenge;
        msg.signature = signature;
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
    msg.signer = kwilSigner.signer;
    msg.signatureType = kwilSigner.signatureType;
    msg.identifier = kwilSigner.identifier;

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
    actionBody: ActionBody,
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

  private validateNamespace(namespace: string): boolean {
    // Validate namespace
    if (!namespace || typeof namespace !== 'string') {
      return false;
    }

    // Check for SQL injection attempts in namespace
    if (/[';{}\\]/.test(namespace)) {
      return false;
    }

    // validate alphanumeric and underscore
    if (!/^[a-zA-Z0-9_]+$/.test(namespace)) {
      return false;
    }

    return true;
  }
}
