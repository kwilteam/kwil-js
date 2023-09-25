import {DropDbPayload, Transaction} from "../core/tx";
import {Nillable, NonNil, Promisy} from "../utils/types";
import {objects} from "../utils/objects";
import {Kwil} from "../client/kwil";
import {TxnBuilderImpl} from "./transaction_builder";
import { CustomSigner, DBBuilder, SignerSupplier } from "../core/builders";
import { AttributeType, DataType, IndexType, PayloadType } from "../core/enums";
import { Database } from "../core/database";
import { enforceDatabaseOrder } from "../core/order";
import { SignatureType, getSigType } from "../core/signature";

/**
 * `DBBuilderImpl` class is an implementation of the `DBBuilder` interface.
 * It creates a transaction to deploy a new database on the Kwil network.
 */

export class DBBuilderImpl implements DBBuilder {
    private readonly client: Kwil;
    private _payload: Nillable<() => NonNil<object>> = null;
    private _signer: Nillable<SignerSupplier> = null;
    private _signatureType: Nillable<SignatureType>;
    private _payloadType: Nillable<PayloadType> = null;
    private _publicKey: Nillable<string | Uint8Array> = null;
    private _description: Nillable<string> = null;

    private constructor(client: Kwil, payloadType: PayloadType) {
        this.client = client;
        this._payloadType = payloadType;
    }

    public static of(client: NonNil<Kwil>, payloadType: NonNil<PayloadType>): NonNil<DBBuilder> {
        return new DBBuilderImpl(objects.requireNonNil(client), objects.requireNonNil(payloadType));
    }

    signer(signer: SignerSupplier, signatureType?: SignatureType): NonNil<DBBuilder> {
        this._signer = objects.requireNonNil(signer);
        
        if(!signatureType) {
            this._signatureType = getSigType(signer);
            if(this._signatureType === SignatureType.SIGNATURE_TYPE_INVALID) {
                throw new Error("Could not determine signature type from signer. Please pass a signature type to .signer().");
            }
            return this;
        }

        this._signatureType = objects.requireNonNil(signatureType);

        return this;
    }


    payload(payload: (() => NonNil<object | DropDbPayload>) | NonNil<object | DropDbPayload>): NonNil<DBBuilder> {
        this._payload = typeof objects.requireNonNil(payload) !== "function" ?
            () => payload :
            payload as () => NonNil<object>;
        // const encodablePayload = this.makePayloadEncodable(payload);
        // const orderedPayload = enforceDatabaseOrder(encodablePayload);
        // this._payload = () => orderedPayload;
        return this;
    }

    publicKey(publicKey: string): NonNil<DBBuilder> {
        this._publicKey = objects.requireNonNil(publicKey);
        return this;
    }

    description(description: string): NonNil<DBBuilder> {
        this._description = objects.requireNonNil(description);
        return this;
    }

    async buildTx(): Promise<Transaction> {
        let cleanedPayload: () => NonNil<object> = () => ({});
        const payload = objects.requireNonNil(this._payload);

        if (this._payloadType === PayloadType.DEPLOY_DATABASE) {
            const encodablePayload = this.makePayloadEncodable(payload);
            cleanedPayload = () => enforceDatabaseOrder(encodablePayload);
        }

        if(this._payloadType === PayloadType.DROP_DATABASE) {
            cleanedPayload = () => payload();
        }

        const payloadType = objects.requireNonNil(this._payloadType);
        const signer = objects.requireNonNil(this._signer)
        const signatureType = await Promisy.resolveOrReject(this._signatureType);
        let tx = TxnBuilderImpl
            .of(this.client)
            .payloadType(objects.requireNonNil(payloadType))
            .payload(objects.requireNonNil(cleanedPayload))
            .signer(signer, signatureType)
            .publicKey(objects.requireNonNil(this._publicKey))
            .description(this._description)


        return tx.buildTx();
    }

    private makePayloadEncodable(payload: (() => NonNil<object>) | NonNil<object>): NonNil<Database> {
        // check if the payload has the required fields for the database

        const resolvedPayload = typeof payload === "function" ? payload() : payload;

        let db: Database = resolvedPayload as Database;

        if (!db.owner) {
            db.owner = new Uint8Array();
        };

        if (!db.name) {
            db.name = "";
        }

        if (!db.tables) {
            db.tables = [];
        }

        db.tables && db.tables.forEach(table => {
            if (!table.name) {
                table.name = "";
            }

            if (!table.columns) {
                table.columns = [];
            }

            table.columns && table.columns.forEach(column => {
                if (!column.name) {
                    column.name = "";
                }

                if (!column.type) {
                    column.type = DataType.NULL;
                }

                if (!column.attributes) {
                    column.attributes = [];
                }

                column.attributes && column.attributes.forEach(attribute => {
                    if (!attribute.type) {
                        attribute.type = AttributeType.INVALID_TYPE;
                    }

                    if (!attribute.value) {
                        attribute.value = "";
                    }
                });                
            });

            if (!table.indexes) {
                table.indexes = [];
            }

            table.indexes && table.indexes.forEach(index => {
                if (!index.name) {
                    index.name = "";
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

            table.foreign_keys && table.foreign_keys.forEach(foreign_key => {
                if (!foreign_key.child_keys) {
                    foreign_key.child_keys = [];
                }

                if (!foreign_key.parent_keys) {
                    foreign_key.parent_keys = [];
                }

                if (!foreign_key.parent_table) {
                    foreign_key.parent_table = "";
                }

                if (!foreign_key.actions) {
                    foreign_key.actions = [];
                }

                foreign_key.actions && foreign_key.actions.forEach(action => {
                    if (!action.on) {
                        action.on = "";
                    }

                    if (!action.do) {
                        action.do = "";
                    }
                });
            });
        });

        if (!db.actions) {
            db.actions = [];
        };

        db.actions && db.actions.forEach(action => {
            if (!action.name) {
                action.name = "";
            }

            if (!action.inputs) {
                action.inputs = [];
            }

            if (!action.mutability) {
                action.mutability = "";
            }

            if (!action.auxiliaries) {
                action.auxiliaries = [];
            }

            if (!action.public) {
                action.public = true;
            }

            if (!action.statements) {
                action.statements = [];
            }
        });

        if (!db.extensions) {
            db.extensions = [];
        };

        db.extensions && db.extensions.forEach(extension => {
            if (!extension.name) {
                extension.name = "";
            }

            if (!extension.config) {
                extension.config = [];
            }

            if (!extension.alias) {
                extension.alias = "";
            }

            extension.config && extension.config.forEach(config => {
                if (!config.Argument) {
                    config.Argument = "";
                }

                if (!config.Value) {
                    config.Value = "";
                }
            });
        });

        return db;
    }
}
