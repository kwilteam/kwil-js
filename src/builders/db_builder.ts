import { Transaction } from '../core/tx';
import { Nillable, NonNil, Promisy } from '../utils/types';
import { objects } from '../utils/objects';
import { Kwil } from '../client/kwil';
import { PayloadBuilderImpl } from './payload_builder';
import { DBBuilder, SignerSupplier } from '../core/builders';
import { AttributeType, DataType, DeployOrDrop, EnvironmentType, IndexType, PayloadType } from '../core/enums';
import { Database } from '../core/database';
import { enforceDatabaseOrder } from '../core/order';
import { AnySignatureType, SignatureType, getSignatureType } from '../core/signature';
import { CompiledKuneiform, DbPayloadType, DropDbPayload } from '../core/payload';

/**
 * `DBBuilderImpl` class is an implementation of the `DBBuilder` interface.
 * It creates a transaction to deploy a new database on the Kwil network.
 */

export class DBBuilderImpl<T extends DeployOrDrop, U extends EnvironmentType> implements DBBuilder<T> {
  private readonly kwil: Kwil<U>;
  private _payload: Nillable<() => NonNil<CompiledKuneiform | DropDbPayload>> = null;
  private _signer: Nillable<SignerSupplier> = null;
  private _signatureType: Nillable<AnySignatureType>;
  private _payloadType: Nillable<PayloadType> = null;
  private _identifier: Nillable<string | Uint8Array> = null;
  private _chainId: Nillable<string> = null;
  private _description: Nillable<string> = null;
  private _nonce: Nillable<number> = null;

  /**
   * Initializes a new `DBBuilderImpl` instance.
   *
   * @param {Kwil} kwil = The Kwil client, used to call higher level methods on the Kwil class.
   * @param {DeployOrDrop} payloadType - The payload type for the database transaction. This should be `PayloadType.DEPLOY_DATABASE` or `PayloadType.DROP_DATABASE`.
   * @returns {DBBuilder} A new `DBBuilderImpl` instance.
   */
  private constructor(kwil: Kwil<U>, payloadType: DeployOrDrop) {
    this.kwil = kwil;
    this._payloadType = payloadType;
  }

  /**
   * Creates a new `DbBuilder` instance.
   *
   * @param {Kwil} client - The Kwil client, used to call higher level methods on the Kwil class.
   * @param {PayloadType} payloadType - The payload type for the database transaction. This should be `PayloadType.DEPLOY_DATABASE` or `PayloadType.DROP_DATABASE`.
   * @returns {DBBuilder} A new `DBBuilderImpl` instance.
   */
  public static of<T extends DeployOrDrop, U extends EnvironmentType>(
    client: NonNil<Kwil<U>>,
    payloadType: NonNil<DeployOrDrop>
  ): NonNil<DBBuilder<T>> {
    // throw runtime error if client or payloadType is null
    return new DBBuilderImpl<T, U>(
      objects.requireNonNil(
        client,
        'client is required for DbBuilder. Please pass a valid Kwil client. This is an internal error, please create an issue.'
      ),
      objects.requireNonNil(
        payloadType,
        'payloadType is required for DbBuilder. Please pass a valid PayloadType. This is an internal error, please create an issue.'
      )
    );
  }

  /**
   * Specifies the signer for the database transaction.
   *
   * @param {SignerSupplier} signer - The signer for the database transaction. This can be a `Signer` from Ethers v5 or Ethers v6 or a custom signer function. Custom signers must be of the form `(message: Uint8Array, ...args: any[]) => Promise<Uint8Array>`.
   * @param {AnySignatureType} signatureType - The signature type for the database transaction. This is only required if the signer is a custom signer function.
   * @returns {DBBuilder} The current `DBBuilder` instance for chaining.
   * @throws Will throw an error if the signer is null or undefined.
   * @throws Will throw an error if the signature type is null or undefined.
   * @throws Will throw an error if it cannot infer the signature type from the signer.
   */
  signer(signer: SignerSupplier, signatureType?: AnySignatureType): NonNil<DBBuilder<T>> {
    // throw runtime error if signer is null
    this._signer = objects.requireNonNil(
      signer,
      'no signer provided. please specify a signing function or pass an Ethers signer in the KwilSigner.'
    );

    if (!signatureType) {
      // infer signature type from signer
      this._signatureType = getSignatureType(signer);

      // throw runtime error if signature type is null
      if (this._signatureType === SignatureType.SIGNATURE_TYPE_INVALID) {
        throw new Error(
          'Could not determine signature type from signer. Please pass a signature type to .signer().'
        );
      }
      return this;
    }

    // throw runtime error if signature type is null
    this._signatureType = objects.requireNonNil(
      signatureType,
      'signature type cannot be null or undefined. please specify signature type.'
    );

    return this;
  }

  /**
   * The payload for the database deployment or database drop.
   *
   * @param {DbPayloadType<T>} payload - The payload for the database deployment or database drop. This should be a callback function that resolves to either a `CompiledKuneiform` or `DropDbPayload` object, or just objects that match either of those interfaces.
   * @returns {DBBuilder} The current `DBBuilder` instance for chaining.
   * @throws Will throw an error if the payload is null or undefined.
   */
  payload(payload: DbPayloadType<T>): NonNil<DBBuilder<T>> {
    // throw runtime error if payload is null
    const ensuredPayload = objects.requireNonNil(payload, 'dbBuilder payload cannot be null');
    // ensure payload is a callback function for lazy evaluation
    this._payload =
      typeof ensuredPayload !== 'function'
        ? () => ensuredPayload
        : (ensuredPayload as () => NonNil<CompiledKuneiform | DropDbPayload>);
    return this;
  }

  /**
   * Specifies the identifier (e.g. wallet, public key, etc) for the database deployment / drop.
   *
   * @param {string | Uint8Array} identifier - The identifier for the database deployment / drop.
   * @returns {DBBuilder} The current `DBBuilder` instance for chaining.
   * @throws Will throw an error if the identifier is null or undefined.
   */
  publicKey(identifier: string | Uint8Array): NonNil<DBBuilder<T>> {
    // throw runtime error if identifier is null
    this._identifier = objects.requireNonNil(
      identifier,
      'identifier is required for DbBuilder. Please pass a valid identifier to the .publicKey() method.'
    );
    return this;
  }

  /**
   * Specifies the chain ID for the network being used.
   *
   * @param {string} chainId - The chain ID for the network being used.
   * @returns {DBBuilder} The current `ActionBuilder` instance for chaining.
   */
  chainId(chainId: string): NonNil<DBBuilder<T>> {
    this._chainId = objects.requireNonNil(chainId, 'chain ID cannot be null or undefined.');
    return this;
  }

  /**
   * Specifies the descriptions to be included in the message that is signed.
   *
   * @param {string} description - The description to be included in the message that is signed.
   * @returns {DBBuilder} The current `DBBuilder` instance for chaining.
   * @throws Will throw an error if the description is null or undefined.
   */
  description(description: string): NonNil<DBBuilder<T>> {
    // throw runtime error if description is null
    this._description = objects.requireNonNil(
      description,
      'description cannot be null or undefined.'
    );
    return this;
  }

  /**
   * Specifies the nonce for the database deployment / drop. This is optional, and if not specified, the nonce will be retrieved from the Kwil network.
   * 
   * @param {number} nonce - The nonce for the database deployment / drop.
   * @returns {DBBuilder} The current `DBBuilder` instance for chaining.
   */
  nonce(nonce: number): NonNil<DBBuilder<T>> {
    this._nonce = nonce;
    return this;
  }

  /**
   * Builds a Transaction. This will call the kwil network to retrieve the nonce for the signer.
   *
   * @returns {Promise<Transaction>} - A promise that resolves to a `Transaction` object. The `Transaction` object can be broadcasted to the Kwil network using `kwil.broadcast(tx)`.
   * @throws Will throw an error if there are any errors in the payload.
   * @throws Will throw an error if there is an issue with the account retrieval.
   */
  async buildTx(): Promise<Transaction> {
    // throw runtime error if payload is null
    const payload = objects.requireNonNil(
      this._payload,
      'payload cannot be null or undefined. please provide a payload to DBBuilder.'
    );

    // create cleanedPayload that is equal to the current callback function
    let cleanedPayload: () => NonNil<object> = () => payload();

    // if it is a deploy database, we need to add all of the required fields and field order to make it RLP encodable. The Kuneiform parser does not include null fields.
    if (this._payloadType === PayloadType.DEPLOY_DATABASE) {
      // make the payload encodable
      const encodablePayload = this.makePayloadEncodable(
        payload as () => NonNil<CompiledKuneiform>
      );
      // reassign cleanedPayload to be a callback function that returns the encodable payload with the correct order
      cleanedPayload = () => enforceDatabaseOrder(encodablePayload);
    }

    // throw runtime errors if any of the required fields are null
    const payloadType = objects.requireNonNil(
      this._payloadType,
      'payload type cannot be null or undefined. please specify a payload type.'
    );
    const signer = objects.requireNonNil(
      this._signer,
      'signer cannot be null or undefined. please specify a signer.'
    );
    const identifier = objects.requireNonNil(
      this._identifier,
      'identifier cannot be null or undefined. please specify a identifier.'
    );
    const chainId = objects.requireNonNil(
      this._chainId,
      'chain ID cannot be null or undefined. please specify a chain ID.'
    );
    const signatureType = await Promisy.resolveOrReject(
      this._signatureType,
      'signature type cannot be null or undefined. please specify a signature type.'
    );

    let tx = PayloadBuilderImpl.of(this.kwil)
      .payloadType(payloadType)
      .payload(cleanedPayload)
      .signer(signer, signatureType)
      .publicKey(identifier)
      .chainId(chainId)
      .description(this._description);

    if (this._nonce) {
      tx = tx.nonce(this._nonce);
    }
    return tx.buildTx();
  }

  /**
   * Ensures the compiled kuneiform schema has all of the required fields for RLP encoding.
   *
   * @param payload
   * @returns
   */
  private makePayloadEncodable(payload: () => NonNil<CompiledKuneiform>): NonNil<Database> {
    // check if the payload has the required fields for the database

    const resolvedPayload = payload();

    let db: Database = resolvedPayload as Database;

    if (!db.owner) {
      db.owner = new Uint8Array();
    }

    if (!db.name) {
      db.name = '';
    }

    if (!db.tables) {
      db.tables = [];
    }

    db.tables &&
      db.tables.forEach((table) => {
        if (!table.name) {
          table.name = '';
        }

        if (!table.columns) {
          table.columns = [];
        }

        table.columns &&
          table.columns.forEach((column) => {
            if (!column.name) {
              column.name = '';
            }

            if (!column.type) {
              column.type = DataType.NULL;
            }

            if (!column.attributes) {
              column.attributes = [];
            }

            column.attributes &&
              column.attributes.forEach((attribute) => {
                if (!attribute.type) {
                  attribute.type = AttributeType.INVALID_TYPE;
                }

                if (!attribute.value) {
                  attribute.value = '';
                }
              });
          });

        if (!table.indexes) {
          table.indexes = [];
        }

        table.indexes &&
          table.indexes.forEach((index) => {
            if (!index.name) {
              index.name = '';
            }

            if (!index.columns) {
              index.columns = [];
            }

            if (!index.type) {
              index.type = IndexType.INVALID_INDEX_TYPE;
            }
          });

        if (!table.foreign_keys) {
          table.foreign_keys = [];
        }

        table.foreign_keys &&
          table.foreign_keys.forEach((foreign_key) => {
            if (!foreign_key.child_keys) {
              foreign_key.child_keys = [];
            }

            if (!foreign_key.parent_keys) {
              foreign_key.parent_keys = [];
            }

            if (!foreign_key.parent_table) {
              foreign_key.parent_table = '';
            }

            if (!foreign_key.actions) {
              foreign_key.actions = [];
            }

            foreign_key.actions &&
              foreign_key.actions.forEach((action) => {
                if (!action.on) {
                  action.on = '';
                }

                if (!action.do) {
                  action.do = '';
                }
              });
          });
      });

    if (!db.actions) {
      db.actions = [];
    }

    db.actions &&
      db.actions.forEach((action) => {
        if (!action.name) {
          action.name = '';
        }

        if(!action.annotations) {
          action.annotations = [];
        }

        if (!action.inputs) {
          action.inputs = [];
        }

        if (!action.mutability) {
          action.mutability = '';
        }

        if (!action.auxiliaries) {
          action.auxiliaries = [];
        }

        if ((action.public === undefined )|| (action.public === null)) {
          action.public = true;
        }

        if (!action.statements) {
          action.statements = [];
        }
      });

    if (!db.extensions) {
      db.extensions = [];
    }

    db.extensions &&
      db.extensions.forEach((extension) => {
        if (!extension.name) {
          extension.name = '';
        }

        if (!extension.config) {
          extension.config = [];
        }

        if (!extension.alias) {
          extension.alias = '';
        }

        extension.config &&
          extension.config.forEach((config) => {
            if (!config.argument) {
              config.argument = '';
            }

            if (!config.value) {
              config.value = '';
            }
          });
      });

    return db;
  }
}
