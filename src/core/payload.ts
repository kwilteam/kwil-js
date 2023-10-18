import { NonNil } from "../utils/types";
import { ActionSchema, Attribute, Column, Extension, Index, Table, Database } from "./database";
import { PayloadType, ValueType } from "./enums";

/**
 * `AllPayloads` is the union of all payload types.
 */
export type AllPayloads = UnencodedActionPayload<PayloadType.CALL_ACTION | PayloadType.EXECUTE_ACTION> |
    DbPayloadType<PayloadType.DEPLOY_DATABASE | PayloadType.DROP_DATABASE> |
    DropDbPayload |
    CompiledKuneiform;

/**
 * Unencoded action payload is the non-RlP encoded version of the payload body for actions (both `update` and `view` actions).
 */
export type UnencodedActionPayload<T extends PayloadType.CALL_ACTION | PayloadType.EXECUTE_ACTION> = {
    dbid: string;
    action: string;
    arguments: ActionValueType<T> | [];
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
 * `DBPayloadType` is the the payload type for deploying and dropping databases.
 * The generic allows the Builder to be typed to the correct payload type.
 */
export type DbPayloadType<T extends PayloadType.DEPLOY_DATABASE | PayloadType.DROP_DATABASE> = T extends PayloadType.DEPLOY_DATABASE ?
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
    owner: Uint8Array | string;
    name: string;
    tables?: Partial<CompiledTable>[];
    actions?: Partial<CompiledAction>[];
    extensions?: Partial<Extension>[];
};

type CompiledTable = Omit<Table, 'columns' | 'indexes'> & {
    columns: ReadonlyArray<Partial<CompiledColumn>>;
    indexes: ReadonlyArray<Partial<CompiledIndex>>;
}

type CompiledColumn = Omit<Column, 'attributes' | 'type'> & {
    type: string;
    attributes: ReadonlyArray<Partial<CompiledAttribute>>;
}

type CompiledAttribute = Omit<Attribute, 'type'> & {
    type: string;
}

type CompiledIndex = Omit<Index, 'type'> & {
    type: string;
}

type CompiledAction = Omit<ActionSchema, 'auxiliaries' | 'inputs'> & {
    auxiliaries: ReadonlyArray<string> | null;
    inputs: ReadonlyArray<string> | null;
}
