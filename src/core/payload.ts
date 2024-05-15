import { NonNil, PartialNillable } from "../utils/types";
import { ActionSchema, Attribute, Column, Extension, Index, Table, Database, Procedure, ForeignProcedure, EncodeableDatabase } from "./database";
import { BytesEncodingStatus, DeployOrDrop, PayloadType, ValueType } from "./enums";

/**
 * `AllPayloads` is the union of all payload types.
 */
export type AllPayloads = UnencodedActionPayload<PayloadType.CALL_ACTION | PayloadType.EXECUTE_ACTION> |
    DropDbPayload |
    CompiledKuneiform |
    TransferPayload<BytesEncodingStatus.HEX_ENCODED>
    | EncodeableDatabase

export type UnencodedActionPayload<T extends PayloadType.CALL_ACTION | PayloadType.EXECUTE_ACTION> = {
    dbid: string;
    action: string;
    arguments: ActionValueType<T> | [];
    nilArgs: NilArgValueType<T> | [];
}

/**
 * `ActionValueType` is the type of the `arguments` field in the `UnencodedActionPayload` type.
 * The generic allows the UnencodedActionPayload to be typed to the correct payload type.
 * Update actions can have nested `ValueType` arrays because the allow bulk actions.
 * View actions can only have a single `ValueType` array because they only allow single actions. 
 */
type ActionValueType<T extends PayloadType.CALL_ACTION | PayloadType.EXECUTE_ACTION> = T extends PayloadType.EXECUTE_ACTION ?
    ValueType[][] :
    ValueType[];

/**
 * `NilArgValueType` is the type of the `nilArgs` field in the `UnencodedActionPayload` type.
 * The generic allows the UnencodedActionPayload to be typed to the correct payload type.
 * Update actions can have nested `boolean` arrays because the allow bulk actions.
 * View actions can only have a single `boolean` array because they only allow single actions.
 * The `NilArgValueType` is used to indicate whether the action has nil arguments, and the location of the nil arguments.
 */
type NilArgValueType<T extends PayloadType.CALL_ACTION | PayloadType.EXECUTE_ACTION> = T extends PayloadType.EXECUTE_ACTION ?
    boolean[][] :
    boolean[];

/**
 * `DBPayloadType` is the the payload type for deploying and dropping databases.
 * The generic allows the Builder to be typed to the correct payload type.
 */
export type DbPayloadType<T extends DeployOrDrop> = T extends PayloadType.DEPLOY_DATABASE ?
    (() => NonNil<CompiledKuneiform>) | NonNil<CompiledKuneiform> :
    (() => NonNil<DropDbPayload>) | NonNil<DropDbPayload>;

/**
 * `DropDbPayload` is the payload for dropping a database.
 */
export interface DropDbPayload {
    dbid: string
}

/**
 * `CompiledKuneiform` is the compiled version of the Kuneiform schema. This is the schema that is used to deploy a database.
 * The schema follows the Database Interface {@link Database}, with each field being optional.
 */
export interface CompiledKuneiform {
    owner: Uint8Array | string | null,
    name: string;
    tables: PartialNillable<CompiledTable>[] | null;
    actions: PartialNillable<ActionSchema>[] | null;
    extensions: PartialNillable<Extension>[] | null;
    procedures: PartialNillable<Procedure>[] | null;
    foreign_calls: PartialNillable<ForeignProcedure>[] | null;
};

/**
 * `TransferPayload` is the payload for transferring funds.
 * The generic allows the Builder to be typed to the correct payload type.
 * The `to` field is typed to either a Uint8Array or a base64 string depending on the encoding status.
 * The `amount` field is typed to a string because it is a decimal value.
 */
export interface TransferPayload<T extends BytesEncodingStatus> {
    to: T extends BytesEncodingStatus.BASE64_ENCODED ? string : Uint8Array;
    amount: string;
}

// The CompiledXXX types are used to replace the enums in the Database interface with strings.
type CompiledTable = Omit<Table, 'columns' | 'indexes' > & {
    columns: ReadonlyArray<Partial<CompiledColumn>>;
    indexes: ReadonlyArray<Partial<CompiledIndex>>;
}

type CompiledColumn = Omit<Column, 'attributes' > & {
    attributes: ReadonlyArray<Partial<CompiledAttribute>>;
}

type CompiledAttribute = Omit<Attribute, 'type'> & {
    type: string;
}

type CompiledIndex = Omit<Index, 'type'> & {
    type: string;
}