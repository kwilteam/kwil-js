import { AttributeType, DataType, IndexType } from "./enums";


export interface Database<T> {
    name: string;
    owner: string;
    tables: Table<T>[];
    actions: Action[];
}

export interface Table<T> {
    name: string;
    columns: Column<T>[];
    indexes: Index[];
}

export interface Column<T> {
    name: string;
    type: DataType;
    attributes: Attribute<T>[];
}

export interface Attribute<T> {
    type: AttributeType;
    value: T;
}

export interface Index {
    name: string;
    columns: string[];
    type: IndexType;
}

export interface Action {
    name: string;
    public: boolean;
    inputs: string[];
    statements: string[];
}