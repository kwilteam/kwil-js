import { AttributeType, DataType, IndexType } from "./enums";


export interface Database<T> {
    get name(): string;
    get owner(): string;
    get tables(): ReadonlyArray<Table<T>>;
    get actions(): ReadonlyArray<Action>;
}

export interface Table<T> {
    get name(): string;
    get columns(): ReadonlyArray<Column<T>>;
    get indexes(): ReadonlyArray<Index>;
}

export interface Column<T> {
    get name(): string;
    get type(): DataType;
    get attributes(): ReadonlyArray<Attribute<T>>;
}

export interface Attribute<T> {
    get type(): AttributeType;
    get value(): T;
}

export interface Index {
    get name(): string;
    get columns(): ReadonlyArray<string>;
    get type(): IndexType;
}

export interface Action {
    get name(): string;
    get public(): boolean;
    get inputs(): ReadonlyArray<string>;
    get statements(): ReadonlyArray<string>;
}

export interface SelectQuery {
    get dbid(): string;
    get query(): string;
}