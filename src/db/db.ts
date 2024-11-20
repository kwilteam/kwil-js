import { Kwil } from '../client/kwil';
import { SignerSupplier } from '../core/builders';
import { EncodeableDatabase } from '../core/database';
import {
  AttributeType,
  DeployOrDrop,
  EnvironmentType,
  IndexType,
  PayloadType,
  VarType,
} from '../core/enums';
import { enforceDatabaseOrder } from '../core/order';
import { AllPayloads, CompiledKuneiform, DropDbPayload } from '../core/payload';
import { AnySignatureType, getSignatureType, SignatureType } from '../core/signature';
import { Transaction } from '../core/tx';
import { Payload } from '../payload/payload';
import { objects } from '../utils/objects';
import { Promisy } from '../utils/types';
import { validateFields } from '../utils/validation';

export interface DBOptions {
  signer: SignerSupplier;
  payload: () => CompiledKuneiform | DropDbPayload;
  identifier: Uint8Array;
  signatureType: AnySignatureType;
  chainId: string;
  description?: string;
  nonce?: number;
}

export class DB<T extends EnvironmentType> {
  private readonly kwil: Kwil<T>;
  private payloadType: DeployOrDrop;
  private signer: SignerSupplier;
  private payload: () => CompiledKuneiform | DropDbPayload;
  private identifier: Uint8Array;
  private signatureType: AnySignatureType;
  private chainId: string;
  private description?: string;
  private nonce?: number;

  /**
   * Initializes a new `Kwil Database` instance.
   *
   * @param {Kwil} kwil - The Kwil client, used to call higher-level methods on the Kwil class.
   */

  constructor(kwil: Kwil<T>, payloadType: DeployOrDrop, options: DBOptions) {
    this.kwil = kwil;
    this.payloadType = payloadType;
    this.signer = options.signer;
    this.payload = options.payload;
    this.identifier = options.identifier;
    this.signatureType = options.signatureType;
    this.chainId = options.chainId;
    this.description = options.description;
    this.nonce = options.nonce;
  }

  /**
   * Static factory method to create a new Kwil Database instance.
   *
   * @param kwil - The Kwil client.
   * @param options - The options to configure the Kwil Database instance.
   */
  static create<T extends EnvironmentType>(
    kwil: Kwil<T>,
    payloadType: DeployOrDrop,
    options: DBOptions
  ): DB<T> {
    objects.requireNonNil(
      kwil,
      'client is required for DbBuilder. Please pass a valid Kwil client. This is an internal error, please create an issue.'
    ),
      objects.requireNonNil(
        payloadType,
        'payloadType is required for DbBuilder. Please pass a valid PayloadType. This is an internal error, please create an issue.'
      );
    return new DB<T>(kwil, payloadType, options);
  }

  /**
   * Builds a Transaction. This will call the kwil network to retrieve the nonce for the signer.
   *
   * @returns {Promise<Transaction>} - A promise that resolves to a `Transaction` object. The `Transaction` object can be broadcasted to the Kwil network using `kwil.broadcast(tx)`.
   * @throws Will throw an error if there are any errors in the payload.
   * @throws Will throw an error if there is an issue with the account retrieval.
   */
  async buildTx(): Promise<Transaction> {
    // throw runtime error if payload is null or undefined
    const ensuredPayload = objects.requireNonNil(
      this.payload,
      'dbBuilder payload cannot be null or undefined'
    );
    // ensure payload is a callback function for lazy evaluation
    this.payload =
      typeof ensuredPayload !== 'function'
        ? () => ensuredPayload
        : (ensuredPayload as () => CompiledKuneiform | DropDbPayload);

    // create a "clean payload" that equals the current callback
    let cleanedPayload: () => AllPayloads = () => ensuredPayload();

    // if it is a deploy database, we need to add all of the required fields and field order to make it RLP encodable. The Kuneiform parser does not include null fields.
    if (this.payloadType === PayloadType.DEPLOY_DATABASE) {
      // make the payload encodable
      const encodablePayload = this.makePayloadEncodable(ensuredPayload as () => CompiledKuneiform);

      // reassign "clean payload" to be a callback function that returns the encodable payload in the correct order
      cleanedPayload = () => enforceDatabaseOrder(encodablePayload);
    }

    if (!this.signatureType) {
      this.signatureType = getSignatureType(this.signer!);
    }

    if (this.signatureType === SignatureType.SIGNATURE_TYPE_INVALID) {
      throw new Error('Invalid or missing signature type.');
    }

    // throw runtime errors if any of the required fields are null or undefined
    const { payloadType, signer, identifier, chainId } = validateFields(
      {
        payloadType: this.payloadType,
        signer: this.signer,
        identifier: this.identifier,
        chainId: this.chainId,
      },
      (fieldName: string) =>
        `${fieldName} cannot be null or undefined. please specify a ${fieldName}`
    );

    // throw runtime errors if signatureType is null or undefined
    const signatureType = await Promisy.resolveOrReject(
      this.signatureType,
      'signature type cannot be null or undefined. please specify a signature type.'
    );

    // build transaction
    return await Payload.create(this.kwil, {
      payloadType: payloadType,
      payload: cleanedPayload,
      signer: signer,
      signatureType: signatureType,
      identifier: identifier,
      chainId: chainId,
      description: this.description,
      nonce: this.nonce,
    }).buildTx();
  }

  /**
   * Ensures the compiled kuneiform schema has all of the required fields for RLP encoding.
   *
   * @param payload
   * @returns
   */
  private makePayloadEncodable(payload: () => CompiledKuneiform): EncodeableDatabase {
    // check if the payload has the required fields for the database

    const resolvedPayload = payload();

    // @ts-ignore
    let db = resolvedPayload as EncodeableDatabase;

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

            if (!column.type.name) {
              column.type.name = VarType.NULL;
            }

            if (!column.type.is_array) {
              column.type.is_array = false;
            }

            // Todo: Revist this, the approach feels hacky
            // Kuneiform parser outputs a null metadata field, but for RLP, we need to remove the metata property from the object
            if (column.type.metadata === null || column.type.metadata === undefined) {
              // remove from object
              column.type = {
                name: column.type.name,
                is_array: column.type.is_array,
              };
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

        if (!action.annotations) {
          action.annotations = [];
        }

        if (!action.parameters) {
          action.parameters = [];
        }

        if (action.public === undefined || action.public === null) {
          action.public = true;
        }

        if (!action.modifiers) {
          action.modifiers = [];
        }

        if (!action.body) {
          action.body = '';
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

        if (!extension.initialization) {
          extension.initialization = [];
        }

        if (!extension.alias) {
          extension.alias = '';
        }

        extension.initialization &&
          extension.initialization.forEach((initialization) => {
            if (!initialization.name) {
              initialization.name = '';
            }

            if (!initialization.value) {
              initialization.value = '';
            }
          });
      });

    if (!db.procedures) {
      db.procedures = [];
    }

    db.procedures &&
      db.procedures.forEach((procedure) => {
        if (!procedure.name) {
          procedure.name = '';
        }

        if (!procedure.parameters) {
          procedure.parameters = [];
        }

        procedure.parameters &&
          procedure.parameters.forEach((parameter) => {
            if (!parameter.name) {
              parameter.name = '';
            }

            if (!parameter.type.name) {
              parameter.type.name = VarType.NULL;
            }

            if (!parameter.type.is_array) {
              parameter.type.is_array = false;
            }

            // Todo: Revist this, the approach feels hacky
            // Kuneiform parser outputs a null metadata field, but for RLP, we need to remove the metata property from the object
            if (parameter.type.metadata === null || parameter.type.metadata === undefined) {
              // remove from object
              parameter.type = {
                name: parameter.type.name,
                is_array: parameter.type.is_array,
              };
            }
          });

        if (procedure.public === undefined || procedure.public === null) {
          procedure.public = true;
        }

        if (!procedure.modifiers) {
          procedure.modifiers = [];
        }

        if (!procedure.body) {
          procedure.body = '';
        }

        if (!procedure.return_types) {
          procedure.return_types = [];
        }

        if (!Array.isArray(procedure.return_types)) {
          if (!procedure.return_types.is_table) {
            procedure.return_types.is_table = false;
          }

          procedure.return_types.fields &&
            procedure.return_types.fields.forEach((field) => {
              if (!field.name) {
                field.name = '';
              }

              if (!field.type.name) {
                field.type.name = VarType.TEXT;
              }

              if (!field.type.is_array) {
                field.type.is_array = false;
              }

              // Todo: Revist this, the approach feels hacky
              // Kuneiform parser outputs a null metadata field, but for RLP, we need to remove the metata property from the object
              if (field.type.metadata === null || field.type.metadata === undefined) {
                // remove from object
                field.type = {
                  name: field.type.name,
                  is_array: field.type.is_array,
                };
              }
            });
        }

        if (!procedure.annotations) {
          procedure.annotations = [];
        }
      });

    if (!db.foreign_calls) {
      db.foreign_calls = [];
    }

    db.foreign_calls &&
      db.foreign_calls.forEach((foreignCall) => {
        if (!foreignCall.name) {
          foreignCall.name = '';
        }

        if (!foreignCall.parameters) {
          foreignCall.parameters = [];
        }

        foreignCall.parameters &&
          foreignCall.parameters.forEach((parameter) => {
            if (!parameter.name) {
              parameter.name = VarType.NULL;
            }

            if (parameter.is_array === undefined || parameter.is_array === null) {
              parameter.is_array = false;
            }

            if (parameter.metadata === null || parameter.metadata === undefined) {
              parameter = {
                name: parameter.name,
                is_array: parameter.is_array,
              };
            }
          });

        if (!foreignCall.return_types) {
          foreignCall.return_types = [];
        }

        if (!Array.isArray(foreignCall.return_types)) {
          if (!foreignCall.return_types.is_table) {
            foreignCall.return_types.is_table = false;
          }

          foreignCall.return_types.fields.forEach((field) => {
            if (!field.name) {
              field.name = '';
            }

            if (!field.type.name) {
              field.type.name = VarType.TEXT;
            }

            if (!field.type.is_array) {
              field.type.is_array = false;
            }

            // Todo: Revist this, the approach feels hacky
            // Kuneiform parser outputs a null metadata field, but for RLP, we need to remove the metata property from the object
            if (field.type.metadata === null || field.type.metadata === undefined) {
              // remove from object
              field.type = {
                name: field.type.name,
                is_array: field.type.is_array,
              };
            }
          });
        }
      });

    return db;
  }
}

// TODO ==> create a helper function that checks for types vs having all of these if statements (ugly)
// TODO ==> consider extracting the various functions into separate classes to make classes cleaner and easier to follow...
