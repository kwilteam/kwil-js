import { NonNil, PartialNillable } from '../utils/types';
import {
  ActionSchema,
  Attribute,
  Column,
  Extension,
  Index,
  Table,
  Database,
  Procedure,
  ForeignProcedure,
  EncodeableDatabase,
  DataType,
  ProcedureReturn,
  NamedType,
} from './database';
import { BytesEncodingStatus, DeployOrDrop, PayloadType } from './enums';

/**
 * `AllPayloads` is the union of all payload types.
 */
export type AllPayloads =
  | UnencodedActionPayload<PayloadType.CALL_ACTION | PayloadType.EXECUTE_ACTION>
  | DropDbPayload
  | CompiledKuneiform
  | TransferPayload<BytesEncodingStatus.HEX_ENCODED>
  | EncodeableDatabase;

export type UnencodedActionPayload<T extends PayloadType.CALL_ACTION | PayloadType.EXECUTE_ACTION> =
  {
    dbid: string;
    action: string;
    arguments: T extends PayloadType.EXECUTE_ACTION ? EncodedValue[][] : EncodedValue[];
  };

export interface EncodedValue {
  type: DataType;
  data: string[] | Uint8Array[];
}

/**
 * `DBPayloadType` is the the payload type for deploying and dropping databases.
 * The generic allows the Builder to be typed to the correct payload type.
 */
export type DbPayloadType<T extends DeployOrDrop> = T extends PayloadType.DEPLOY_DATABASE
  ? (() => NonNil<CompiledKuneiform>) | NonNil<CompiledKuneiform>
  : (() => NonNil<DropDbPayload>) | NonNil<DropDbPayload>;

/**
 * `DropDbPayload` is the payload for dropping a database.
 */
export interface DropDbPayload {
  dbid: string;
  type?: 'drop_db_payload';
}

/**
 * `CompiledKuneiform` is the compiled version of the Kuneiform schema. This is the schema that is used to deploy a database.
 * The schema follows the Database Interface {@link Database}, with each field being optional.
 */
export interface CompiledKuneiform {
  owner: Uint8Array | string | null;
  name: string;
  tables: PartialNillable<CompiledTable>[] | null;
  actions: PartialNillable<ActionSchema>[] | null;
  extensions: PartialNillable<Extension>[] | null;
  procedures: PartialNillable<CompiledProcedure>[] | null;
  foreign_calls: PartialNillable<CompiledForeignProcedure>[] | null;
  type?: 'compiled_kuneiform';
}

/**
 * `TransferPayload` is the payload for transferring funds.
 * The generic allows the Builder to be typed to the correct payload type.
 * The `to` field is typed to either a Uint8Array or a base64 string depending on the encoding status.
 * The `amount` field is typed to a string because it is a decimal value.
 */
export interface TransferPayload<T extends BytesEncodingStatus> {
  to: T extends BytesEncodingStatus.BASE64_ENCODED ? string : Uint8Array;
  amount: string;
  type?: 'transfer_payload';
}

// The CompiledXXX types are used to replace the enums in the Database interface with strings.
export type CompiledTable = Omit<Table, 'columns' | 'indexes'> & {
  columns: ReadonlyArray<CompiledColumn>;
  indexes: ReadonlyArray<CompiledIndex>;
};

type CompiledColumn = Omit<Column, 'attributes' | 'type'> & {
  attributes: ReadonlyArray<CompiledAttribute>;
  type: CompiledDataType;
};

export type CompiledDataType = Omit<DataType, 'name' | 'metadata'> & {
  name: string;
  metadata?: Array<number> | Array<never> | null;
};

type CompiledAttribute = Omit<Attribute, 'type'> & {
  type: string;
};

type CompiledIndex = Omit<Index, 'type'> & {
  type: string;
};

export type CompiledProcedure = Omit<Procedure, 'return_types' | 'parameters'> & {
  parameters: ReadonlyArray<CompiledNamedType>;
  return_types: CompiledProcedureReturn | Array<never>;
};

type CompiledProcedureReturn = Omit<ProcedureReturn, 'fields'> & {
  fields: ReadonlyArray<CompiledNamedType>;
};

type CompiledNamedType = Omit<NamedType, 'type'> & {
  type: CompiledDataType;
};

export type CompiledForeignProcedure = Omit<ForeignProcedure, 'return_types' | 'parameters'> & {
  parameters: ReadonlyArray<CompiledDataType>;
  return_types: CompiledProcedureReturn | Array<never>;
};
