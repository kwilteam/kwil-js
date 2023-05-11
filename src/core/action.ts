import {objects} from "../utils/objects";
import {ValueType} from "./enums";

export type Entry<T extends ValueType> = [string, T];

export type EntryType = Entry<ValueType>;

export type Entries = { [key: string]: ValueType };

export type Predicate =
    (k: [key: string, v: ValueType]) => boolean;

export class Action implements Iterable<EntryType> {
    private readonly map: Entries;

    constructor() {
        this.map = {};
    }

    // This will add, or replace, a value for the given key
    public put<T extends ValueType>(key: string, value: T): Action {
        this.map[assertKey(key)] = value;
        return this;
    }

    // This will add if the key is not already present
    public putIfAbsent<T extends ValueType>(key: string, value: T): Action {
        if (!this.containsKey(key)) {
            this.map[key] = value;
        }
        return this;
    }

    public replace<T extends ValueType>(key: string, value: T): Action {
        if (this.containsKey(key)) {
            this.map[key] = value;
        }
        return this;
    }

    public get<T extends ValueType>(key: string): T {
        return this.map[assertKey(key)] as T;
    }

    public getOrDefault<T extends ValueType>(key: string, defaultValue: T): T {
        return (this.map[assertKey(key)] ?? defaultValue) as T;
    }

    public containsKey(key: string): boolean {
        return this.map.hasOwnProperty(assertKey(key))
    }

    public remove(key: string): boolean {
        return delete this.map[key];
    }

    public toArray(filter?: Predicate): ReadonlyArray<EntryType> {
        return Object
            .entries(this.map)
            .filter(filter ?? (() => true));
    }

    // noinspection JSUnusedLocalSymbols
    private toJSON(): Readonly<Entries> {
        return this.map;
    }

    [Symbol.iterator](): IterableIterator<EntryType> {
        return this.toArray()[Symbol.iterator]();
    }

    public static of(): Action {
        return new Action();
    }

    public static from(entries: Iterable<EntryType>): Action {
        const action = Action.of();
        for (const [key, value] of objects.requireNonNil(entries)) {
            action.map[assertKey(key)] = value;
        }
        return action;
    }

    public static fromObject<T extends {}>(obj: T): Action {
        const action = Action.of();
        for (const [key, value] of Object.entries(objects.requireNonNil(obj))) {
            action.map[assertKey(key)] = value as ValueType;
        }
        return action;
    }

    public static fromObjects<T extends {}>(objs: T[]): Action[] {
        const actions: Action[] = [];
        for (const obj of objects.requireNonNil(objs)) {
            actions.push(Action.fromObject(obj));
        }
        return actions;
    }
}

function assertKey(key: string): string {
    return objects.requireNonNil(key, "key cannot be nil");
}
