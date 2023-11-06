import { generateDBID } from '../utils/dbid';
import Client from '../api_client/client';
import { ApiConfig, Config } from '../api_client/config';
import { GenericResponse } from '../core/resreq';
import { Database, DeployBody, DropBody, SelectQuery } from '../core/database';
import { BaseTransaction, TxReceipt } from '../core/tx';
import { Account, ChainInfo } from '../core/network';
import { ActionBuilderImpl } from '../builders/action_builder';
import { base64ToBytes, bytesToBase64 } from '../utils/base64';
import { DBBuilderImpl } from '../builders/db_builder';
import { NonNil } from '../utils/types';
import { ActionBuilder, DBBuilder } from '../core/builders';
import { wrapConfig, wrapEstimate } from './intern';
import { Cache } from '../utils/cache';
import { TxInfoReceipt } from '../core/txQuery';
import { BaseMessage, Message, MsgReceipt } from '../core/message';
import { BytesEncodingStatus, PayloadType } from '../core/enums';
import { bytesToEthHex, bytesToHex, hexToBytes, stringToBytes } from '../utils/serial';
import { isNearPubKey, nearB58ToHex } from '../utils/keys';
import { ActionBody, ActionInput, Entries, resolveActionInputs } from '../core/action';
import { KwilSigner } from '../core/kwilSigner';
import { objects } from '../utils/objects';
import { executeSign } from '../core/signature';
import { computeAddress } from 'ethers';
import { composeAuthMsg } from '../core/auth';

/**
 * The main class for interacting with the Kwil network.
 */

export abstract class Kwil {
  private readonly client: Client;
  private readonly kwilProvider: string;
  private readonly chainId: string;
  //cache schemas
  private schemas: Cache<GenericResponse<Database>>;

  protected constructor(opts: Config) {
    this.client = new Client({
      kwilProvider: opts.kwilProvider,
      apiKey: opts.apiKey,
      network: opts.network,
      timeout: opts.timeout,
      logging: opts.logging,
      logger: opts.logger,
      cache: opts.cache,
    });

    this.schemas = Cache.passive(opts.cache);

    // set chainId
    this.chainId = opts.chainId;

    // set kwilProvider
    this.kwilProvider = opts.kwilProvider;

    //create a wrapped symbol of estimateCost method
    wrapEstimate(this, this.client.estimateCost.bind(this.client));

    // create a wrapped symbol of config so it can be accessed by other classes
    wrapConfig(this, opts);
  }

  /**
   * Generates a unique database identifier (DBID) from the provided owner's public key and a database name.
   *
   * @param owner - The owner's public key (Ethereum or NEAR Protocol). Ethereum keys can be passed as a hex string (0x123...) or as bytes (Uint8Array). NEAR protocol public keys can be passed as the base58 encoded public key (with "ed25519:" prefix), a hex string, or bytes (Uint8Array).
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
    const res = await this.client.getSchema(dbid);

    //cache result
    if (res.status === 200) {
      this.schemas.set(dbid, res);
    }

    return res;
  }

  /**
   * Retrieves an account using the owner's Ethereum wallet address.
   *
   * @param owner - The owner's public key (Ethereum or NEAR Protocol). Ethereum keys can be passed as a hex string (0x123...) or as bytes (Uint8Array). NEAR protocol public keys can be passed as the base58 encoded public key (with "ed25519:" prefix), a hex string, or bytes (Uint8Array).
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

    return await this.client.getAccount(owner);
  }

  /**
   * Returns an instance of ActionBuilder for this client.
   *
   * @returns An ActionBuilder instance. ActionBuilder is used to build action transactions to be broadcasted to the Kwil network.
   * @deprecated Use `kwil.execute()` or `kwil.call()` instead. See: {@link https://github.com/kwilteam/kwil-js/issues/32}.
   */

  public actionBuilder(): NonNil<ActionBuilder> {
    return ActionBuilderImpl.of(this).chainId(this.chainId);
  }

  /**
   * Returns an instance of DBBuilder for this client.
   *
   * @returns A DBBuilder instance. DBBuilder is used to build new database transactions to be broadcasted to the Kwil network.
   * @deprecated Use `kwil.deploy()` See: {@link https://github.com/kwilteam/kwil-js/issues/32}.
   */

  public dbBuilder(): NonNil<DBBuilder<PayloadType.DEPLOY_DATABASE>> {
    return DBBuilderImpl.of<PayloadType.DEPLOY_DATABASE>(this, PayloadType.DEPLOY_DATABASE).chainId(
      this.chainId
    );
  }

  /**
   * Returns an instance of Drop Database Builder for this client.
   *
   * @returns A Drop Database Builder instance. Drop Database Builder is used to build drop database transactions to be broadcasted to the Kwil network.
   * @deprecated Use `kwil.drop()` See: {@link https://github.com/kwilteam/kwil-js/issues/32}.
   */

  public dropDbBuilder(): NonNil<DBBuilder<PayloadType.DROP_DATABASE>> {
    return DBBuilderImpl.of<PayloadType.DROP_DATABASE>(this, PayloadType.DROP_DATABASE).chainId(
      this.chainId
    );
  }

  /**
   * Broadcasts a transaction on the network.
   *
   * @param tx - The transaction to broadcast. The transaction can be built using the ActionBuilder or DBBuilder.
   * @returns A promise that resolves to the receipt of the transaction. The transaction receipt includes the transaction hash, fee, and body.
   * @deprecated Use `kwil.execute()` or `kwil.deploy()` instead. See: {@link https://github.com/kwilteam/kwil-js/issues/32}.
   */

  public async broadcast(
    tx: BaseTransaction<BytesEncodingStatus.BASE64_ENCODED>
  ): Promise<GenericResponse<TxReceipt>> {
    return await this.client.broadcast(tx);
  }

  /**
   * Executes a transaction on a Kwil network. These are mutative actions that must be mined on the Kwil network's blockchain.
   *
   * @param actionBody - The body of the action to send. This should use the `ActionBody` interface.
   * @param kwilSigner - The signer for the action transactions.
   * @returns A promise that resolves to the receipt of the transaction.
   */
  public async execute(
    actionBody: ActionBody,
    kwilSigner: KwilSigner
  ): Promise<GenericResponse<TxReceipt>> {
    let tx = ActionBuilderImpl.of(this)
      .dbid(actionBody.dbid)
      .name(actionBody.action)
      .description(actionBody.description || '')
      .publicKey(kwilSigner.publicKey)
      .chainId(this.chainId)
      .signer(kwilSigner.signer, kwilSigner.signatureType);

    if (actionBody.inputs) {
      const inputs = resolveActionInputs(actionBody.inputs);

      tx = tx.concat(inputs);
    }

    const transaction = await tx.buildTx();

    return await this.client.broadcast(transaction);
  }

  /**
   * Deploys a database to the Kwil network.
   *
   * @param deployBody - The body of the database to deploy. This should use the `DeployBody` interface.
   * @param kwilSigner - The signer for the database deployment.
   * @returns A promise that resolves to the receipt of the transaction.
   */
  public async deploy(
    deployBody: DeployBody,
    kwilSigner: KwilSigner
  ): Promise<GenericResponse<TxReceipt>> {
    const tx = await DBBuilderImpl.of<PayloadType.DEPLOY_DATABASE>(
      this,
      PayloadType.DEPLOY_DATABASE
    )
      .description(deployBody.description || '')
      .payload(deployBody.schema)
      .publicKey(kwilSigner.publicKey)
      .signer(kwilSigner.signer, kwilSigner.signatureType)
      .chainId(this.chainId)
      .buildTx();

    return await this.client.broadcast(tx);
  }

  /**
   * Drops a database from the Kwil network.
   *
   * @param dropBody - The body of the database to drop. This should use the `DropBody` interface.
   * @param kwilSigner - The signer for the database drop.
   * @returns A promise that resolves to the receipt of the transaction.
   */
  public async drop(
    dropBody: DropBody,
    kwilSigner: KwilSigner
  ): Promise<GenericResponse<TxReceipt>> {
    const tx = await DBBuilderImpl.of<PayloadType.DROP_DATABASE>(this, PayloadType.DROP_DATABASE)
      .description(dropBody.description || '')
      .payload({ dbid: dropBody.dbid })
      .publicKey(kwilSigner.publicKey)
      .signer(kwilSigner.signer, kwilSigner.signatureType)
      .chainId(this.chainId)
      .buildTx();

    return await this.client.broadcast(tx);
  }

  public async authenticate(signer: KwilSigner): Promise<GenericResponse<string>> {
    const ethPk = bytesToEthHex(signer.publicKey);
    const ethAddress = computeAddress(ethPk)

    const auth = await this.client.getAuthenticate(ethAddress);

    const authProperties = objects.requireNonNil(auth.data, "something went wrong retrieving auth info from KGW");

    const msg = composeAuthMsg(authProperties, this.kwilProvider, ethAddress, '1', this.chainId)

    const signature = await executeSign(stringToBytes(msg), signer.signer, signer.signatureType);
    
    const authBody = {
      sender: bytesToBase64(signer.publicKey),
      signature: {
        signature_bytes: bytesToBase64(signature),
        signature_type: signer.signatureType
      }
    }

    console.log(authBody)
    const res = await this.client.postAuthenticate(authBody)

    return res;
  }

  /**
   * Calls a Kwil node. This can be used to execute read-only ('view') actions on Kwil.
   *
   * @param actionBody - The body of the action to send. This should use the `ActionBody` interface.
   * @param kwilSigner (optional) - The signer for the action call, if required. Signers are only required for actions with a `must_sign` attribute. You can check the attributes on an action by calling `kwil.getSchema(dbid)`.
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
      return await this.client.call(actionBody);
    }

    let msg = ActionBuilderImpl.of(this)
      .chainId(this.chainId)
      .dbid(actionBody.dbid)
      .name(actionBody.action)
      .description(actionBody.description || '');

    if (actionBody.inputs) {
      const inputs =
        actionBody.inputs[0] instanceof ActionInput
          ? (actionBody.inputs as ActionInput[])
          : new ActionInput().putFromObjects(actionBody.inputs as Entries[]);

      msg = msg.concat(inputs);
    }

    if (kwilSigner) {
      msg = msg.signer(kwilSigner.signer, kwilSigner.signatureType).publicKey(kwilSigner.publicKey);
    }

    const message = await msg.buildMsg();

    return await this.client.call(message);
  }

  /**
   * Lists all databases owned by a particular owner.
   *
   * @param owner - The owner's public key (Ethereum or NEAR Protocol). Ethereum keys can be passed as a hex string (0x123...) or as bytes (Uint8Array). NEAR protocol public keys can be passed as the base58 encoded public key (with "ed25519:" prefix), a hex string, or bytes (Uint8Array).
   * @returns A promise that resolves to a list of database names.
   */

  public async listDatabases(owner: string | Uint8Array): Promise<GenericResponse<string[]>> {
    if (typeof owner === 'string') {
      if (isNearPubKey(owner)) {
        owner = nearB58ToHex(owner);
      }

      owner = owner.toLowerCase();
      owner = hexToBytes(owner);
    }

    return await this.client.listDatabases(owner);
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

    let res = await this.client.selectQuery(q);
    const uint8 = new Uint8Array(base64ToBytes(res.data as string));
    const decoder = new TextDecoder('utf-8');
    const jsonString = decoder.decode(uint8);
    return {
      status: res.status,
      data: JSON.parse(jsonString),
    } as GenericResponse<Map<string, any>[]>;
  }

  /**
   * Retrieves information about a transaction given its hash.
   *
   * @param hash - The `tx_hash` of the transaction.
   * @returns A promise that resolves to the transaction info receipt.
   */
  public async txInfo(hash: string): Promise<GenericResponse<TxInfoReceipt>> {
    return await this.client.txInfo(hash);
  }

  /**
   * Retrieves the chain id, block height, and latest block hash of the configured network.
   *
   * Will log a warning if the returned chain id does not match the configured chain id.
   *
   * @returns {ChainInfo} - A promise that resolves to the chain info.
   */
  public async chainInfo(): Promise<GenericResponse<ChainInfo>> {
    const info = await this.client.chainInfo();

    if (info.data?.chain_id !== this.chainId) {
      console.warn(
        `WARNING: Chain ID mismatch. Expected ${this.chainId}, got ${info.data?.chain_id}`
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
    return await this.client.ping();
  }
}
