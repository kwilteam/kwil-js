import { AttributeType, DataType, IndexType } from "./enums";

export interface DeployBody {
    schema: CompiledKuneiform;
    description?: string;
};

export interface DropBody {
    dbid: string;
    description?: string;
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
    Argument: string;
    Value: string;
}

export interface SelectQuery {
    dbid: string;
    query: string;
}

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
