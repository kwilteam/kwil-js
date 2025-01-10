import { AttributeType, IndexType, VarType, ValueType } from './enums';
import {
  CompiledForeignProcedure,
  CompiledKuneiform,
  CompiledProcedure,
  CompiledTable,
} from './payload';

/**
 * @typedef {Object} DeployBody is the interface for deploying a database with the `kwil.deploy()` method.
 *
 * @property {CompiledKuneiform} schema - The compiled Kuneiform schema to deploy.
 * @property {string?} description (optional) - The description of the database.
 * @property {number} nonce (optional) - The nonce of the transaction.
 */
export interface DeployBody {
  schema: CompiledKuneiform;
  description?: string;
  nonce?: number;
}

/**
 * @typedef {Object} DropBody is the interface for dropping a database with the `kwil.drop()` method.
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

// Encodable database is the same as database but procedures.returns can be an empty array
export type EncodeableDatabase = Omit<Database, 'tables' | 'procedures' | 'foreign_calls'> & {
  tables: ReadonlyArray<CompiledTable>;
  procedures: ReadonlyArray<CompiledProcedure>;
  foreign_calls: ReadonlyArray<CompiledForeignProcedure>;
};

export interface Database {
  owner: Uint8Array;
  name: string;
  extensions: ReadonlyArray<Extension>;
  tables: ReadonlyArray<Table>;
  actions: ReadonlyArray<ActionSchema>;
  procedures: ReadonlyArray<Procedure>;
  foreign_calls: ReadonlyArray<ForeignProcedure>;
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
  parameters: ReadonlyArray<string>;
  public: boolean;
  modifiers: ReadonlyArray<string>;
  body: string;
}

export interface Extension {
  name: string;
  initialization: ReadonlyArray<ExtensionConfig>;
  alias: string;
}

export interface ExtensionConfig {
  name: string;
  value: string;
}

export interface Procedure {
  name: string;
  parameters: ReadonlyArray<NamedType>;
  public: boolean;
  modifiers: ReadonlyArray<string>;
  body: string;
  return_types: ProcedureReturn;
  annotations: ReadonlyArray<string>;
}

export interface NamedType {
  name: string;
  type: DataType;
}

export interface DataType {
  name: VarType;
  is_array: boolean;
  metadata?: Array<number> | Array<never> | null;
}

export interface ProcedureReturn {
  is_table: boolean;
  fields: ReadonlyArray<NamedType>;
}

export interface SelectQuery {
  dbid?: string;
  query: string;
  params?: ValueType[];
}

export interface ForeignProcedure {
  name: string;
  parameters: ReadonlyArray<DataType>;
  return_types: ProcedureReturn;
}
