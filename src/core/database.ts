import { AttributeType, DataType, IndexType } from "./enums";
import { CompiledKuneiform } from "./payload";

/**
 * `DeployBody` is the interface for deploying a database with the `kwil.deploy()` method.
 * 
 * @property {CompiledKuneiform} schema - The compiled Kuneiform schema to deploy.
 * @property {string?} description (optional) - The description of the database.
 * @property {number} nonce (optional) - The nonce of the transaction.
 */
export interface DeployBody {
    schema: CompiledKuneiform;
    description?: string;
    nonce?: number;
};

/**
 * `DropBody` is the interface for dropping a database with the `kwil.drop()` method.
 * 
 * @property {string} dbid - The database ID of the database to drop.
 * @property {string?} description (optional) - The description of the database.
 * @property {number} nonce (optional) - The nonce of the transaction.
 */
export interface DropBody {
    dbid: string;
    description?: string;
    nonce?: number;
}

export interface Database {
    owner: Uint8Array;
    name: string;
    tables: ReadonlyArray<Table>;
    actions: ReadonlyArray<ActionSchema>;
    extensions: ReadonlyArray<Extension>;
}

export interface Table {
    name: string;
    columns: ReadonlyArray<Column>;
    indexes: ReadonlyArray<Index>;
    foreign_keys: ReadonlyArray<ForeignKey>;
}

export interface Column {
    name: string;
    type: DataType;
    attributes: ReadonlyArray<Attribute>;
}

export interface Attribute {
    type: AttributeType;
    value: string;
}

export interface Index {
    name: string;
    columns: ReadonlyArray<string>;
    type: IndexType;
}

export interface ForeignKey {
    child_keys: ReadonlyArray<string>;
    parent_keys: ReadonlyArray<string>;
    parent_table: string;
    actions: ReadonlyArray<ForeignKeyAction>;
}

export interface ForeignKeyAction {
    on: string;
    do: string;
}

export interface ActionSchema {
    name: string;
    annotations: ReadonlyArray<string>;
    inputs: ReadonlyArray<string>;
    mutability: string;
    auxiliaries: ReadonlyArray<string>;
    public: boolean;
    statements: ReadonlyArray<string>;
}

export interface Extension {
    name: string;
    config: ReadonlyArray<ExtensionConfig>;
    alias: string;
}

export interface ExtensionConfig {
    argument: string;
    value: string;
}

export interface SelectQuery {
    dbid: string;
    query: string;
}