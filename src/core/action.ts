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

    // This will add, or replace, a value for all given keys
    public putAll<T extends ValueType>(entries: Iterable<EntryType>): Action {
        for (const [key, value] of objects.requireNonNil(entries)) {
            this.map[assertKey(key)] = value;
        }
        return this;
    }

    // This will add if the key is not already present
    public putIfAbsent<T extends ValueType>(key: string, value: T): Action {
        if (!this.containsKey(key)) {
            this.map[key] = value;
        }
        return this;
    }

    // This will add for each key that is not already present
    public putAllIfAbsent(entries: Iterable<EntryType>): Action {
        for (const [key, value] of objects.requireNonNil(entries)) {
            if (!this.containsKey(key)) {
                this.map[key] = value;
            }
        }
        return this;
    }

    public replace<T extends ValueType>(key: string, value: T): Action {
        if (this.containsKey(key)) {
            this.map[key] = value;
        }
        return this;
    }

    public replaceAll<T extends ValueType>(entries: Iterable<EntryType>): Action {
        for (const [key, value] of objects.requireNonNil(entries)) {
            if (this.containsKey(key)) {
                this.map[key] = value;
            }
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
        return new Action().putAll(entries);
    }

    public static fromArray(... entries: EntryType[]): Action {
        return Action.from(entries);
    }

    // /* Object methods that may be useful in the future */
    public static fromObject<T extends EntryType>(obj: T): Action {
        return Action.of().putAllFromObject(obj);
    }

    public static fromObjects<T extends EntryType>(... objs: T[]): Action[] {
        return objs.map(obj => Action.fromObject(obj));
    }

    private putAllFromObject<T extends EntryType>(obj: T): Action {
        for (const [key, value] of Object.entries(objects.requireNonNil(obj))) {
            this.map[assertKey(key)] = value;
        }
        return this;
    }

    // public putAllFromObjectIfAbsent<T extends {}>(obj: Extract<T, ValueType>): Action {
    //     for (const [key, value] of Object.entries(objects.requireNonNil(obj))) {
    //         if (!this.containsKey(key)) {
    //             this.map[key] = value;
    //         }
    //     }
    //     return this;
    // }
    //
    // public replaceAllFromObject<T extends {}>(obj: Extract<T, ValueType>): Action {
    //     for (const [key, value] of Object.entries(objects.requireNonNil(obj))) {
    //         if (this.containsKey(key)) {
    //             this.map[key] = value;
    //         }
    //     }
    //     return this;
    // }
    //
    // public toObject(filter?: Predicate): Readonly<Entries> {
    //     if (!filter) {
    //         return this.map;
    //     }
    //
    //     const filtered: Entries = {};
    //     Object
    //         .entries(this.map)
    //         .filter(filter)
    //         .forEach(([key, value]) => filtered[key] = value);
    //
    //     return filtered;
    // }
}

function assertKey(key: string): string {
    return objects.requireNonNil(key, "key cannot be nil");
}
