import { objects } from '../utils/objects';
import { ValueType } from './enums';

export type Entry<T extends ValueType> = [string, T];

export type EntryType = Entry<ValueType>;

export type Entries = { [key: string]: ValueType };

export type Predicate = (k: [key: string, v: ValueType]) => boolean;

/**
 * `ActionBody` Interface is for executing actions via the `kwil.execution()` method.
 *
 * @param {string} dbid - The database ID of the record on which to execute the action.
 * @param {string} action - The name of the action to execute.
 * @param {ActionInput[] | Entries[]} inputs - An array of action inputs.
 * @param {string} description (optional) - An optional description of the action.
 * @param {number} nonce (optional) - An optional nonce value for the action.
 */
export interface ActionBody {
  dbid: string;
  action: string;
  inputs?: Entries[] | ActionInput[];
  description?: string;
  nonce?: number;
}

export function resolveActionInputs(inputs: Entries[] | ActionInput[]): ActionInput[] {
  if (inputs && Array.isArray(inputs)) {
    if ((inputs as ActionInput[]).every((item: ActionInput) => item instanceof ActionInput)) {
      return inputs as ActionInput[];
    } else {
      return new ActionInput().putFromObjects(inputs as Entries[]);
    }
  } else {
    throw new Error(
      'action inputs must be an array of entries or an array of ActionInput instances'
    );
  }
}

/**
 * `ActionInput` class is a utility class for creating action inputs.
 */

export class ActionInput implements Iterable<EntryType> {
  private readonly map: Entries;

  constructor() {
    this.map = {};
  }

  /**
   * Adds or replaces a value for a single action input.
   *
   * @param key - The action input name.
   * @param value - The value to put for the action input.
   * @returns The current `ActionInput` instance for chaining.
   */

  public put<T extends ValueType>(key: string, value: T): ActionInput {
    this.map[assertKey(key)] = value;
    return this;
  }

  /**
   * Adds a value for a single action input if the key is not already present.
   *
   * @param key - The action input name.
   * @param value - The value to put for the action input.
   * @returns The current `ActionInput` instance for chaining.
   */
  public putIfAbsent<T extends ValueType>(key: string, value: T): ActionInput {
    if (!this.containsKey(key)) {
      this.map[key] = value;
    }
    return this;
  }

  /**
   * Replaces a value for a single action input if the key is already present.
   *
   * @param key - The action input name.
   * @param value - The value to replace for the action input.
   * @returns The current `ActionInput` instance for chaining.
   */

  public replace<T extends ValueType>(key: string, value: T): ActionInput {
    if (this.containsKey(key)) {
      this.map[key] = value;
    }
    return this;
  }

  /**
   * Retrieves an action input value given its key.
   *
   * @param key - The action input name.
   * @returns The value associated with the action input name.
   */

  public get<T extends ValueType>(key: string): T {
    return this.map[assertKey(key)] as T;
  }

  /**
   * Retrieves a value by its action input name, or a default value if the action input name is not present.
   *
   * @param key - The action input name.
   * @param defaultValue - The default value to return if the key is not present.
   * @returns The value associated with the key, or the default value.
   */

  public getOrDefault<T extends ValueType>(key: string, defaultValue: T): T {
    return (this.map[assertKey(key)] ?? defaultValue) as T;
  }

  /**
   * Checks if the map contains a specific action input name.
   *
   * @param key - The action input name.
   * @returns True if the action input name is present, false otherwise.
   */

  public containsKey(key: string): boolean {
    return this.map.hasOwnProperty(assertKey(key));
  }

  /**
   * Removes a action input name and its associated value from the map.
   *
   * @param key - The action input name to remove.
   * @returns True if the key was present and is now removed, false otherwise.
   */

  public remove(key: string): boolean {
    return delete this.map[key];
  }

  /**
   * Converts the map of action inputs to an array of entries.
   *
   * @param filter - An optional filter function.
   * @returns A read-only array of entries.
   */

  public toArray(filter?: Predicate): ReadonlyArray<EntryType> {
    return Object.entries(this.map).filter(filter ?? (() => true));
  }

  /**
   * Transforms the `ActionInput` to JSON.
   *
   * @returns A read-only map of entries.
   */

  private toJSON(): Readonly<Entries> {
    return this.map;
  }

  /**
   * Allows `ActionInput` to be iterable.
   *
   * @returns An iterator over the array of entries.
   */

  [Symbol.iterator](): IterableIterator<EntryType> {
    return this.toArray()[Symbol.iterator]();
  }

  /**
   * Adds or replaces values from and object of action name/key-value pairs.
   *
   * @param obj - The object from which to extract action name/key-value pairs.
   * @returns The current `ActionInput` instance for chaining.
   */

  public putFromObject<T extends {}>(obj: T): ActionInput {
    for (const [key, value] of Object.entries(objects.requireNonNil(obj))) {
      this.map[assertKey(key)] = value as ValueType;
    }
    return this;
  }

  /**
   * Adds values from and object of action name/key-value pairs if the key is not already present.
   *
   * @param obj - The object from which to extract key-value pairs.
   * @returns The current `ActionInput` instance for chaining.
   */

  public putFromObjectIfAbsent<T extends {}>(obj: T): ActionInput {
    for (const [key, value] of Object.entries(objects.requireNonNil(obj))) {
      if (!this.containsKey(key)) {
        this.map[assertKey(key)] = value as ValueType;
      }
    }
    return this;
  }

  /**
   * Replaces values from and object of action name/key-value pairs if the key is already present.
   *
   * @param obj - The object from which to extract key-value pairs.
   * @returns The current `ActionInput` instance for chaining.
   */

  public replaceFromObject<T extends {}>(obj: T): ActionInput {
    for (const [key, value] of Object.entries(objects.requireNonNil(obj))) {
      if (this.containsKey(key)) {
        this.map[assertKey(key)] = value as ValueType;
      }
    }
    return this;
  }

  /**
   * Creates multiple `ActionInput` instances from an array of objects.
   *
   * @param objs - An array of objects from which to create `ActionInput` instances.
   * @returns An array of `ActionInput` instances.
   */

  public putFromObjects<T extends {}>(objs: T[]): ActionInput[] {
    const actions: ActionInput[] = [];
    for (const obj of objects.requireNonNil(objs)) {
      actions.push(ActionInput.fromObject(obj));
    }
    return actions;
  }

  /**
   * Factory method to create a new instance of `ActionInput`.
   *
   * @returns A new `ActionInput` instance.
   */

  public static of(): ActionInput {
    return new ActionInput();
  }

  /**
   * Creates a new `ActionInput` instance from an iterable array of entries.
   *
   * @param entries - The iterable of set of entries. Entries should be formatted as an array of `[inputName, value]`.
   * @returns A new `ActionInput` instance.
   */

  public static from(entries: Iterable<EntryType>): ActionInput {
    const action = ActionInput.of();
    for (const [key, value] of objects.requireNonNil(entries)) {
      action.map[assertKey(key)] = value;
    }
    return action;
  }

  /**
   * Creates a new `ActionInput` instance from an object.
   *
   * @param obj - The object from which to create the `ActionInput`.
   * @returns A new `ActionInput` instance.
   */

  public static fromObject<T extends {}>(obj: T): ActionInput {
    const action = ActionInput.of();
    for (const [key, value] of Object.entries(objects.requireNonNil(obj))) {
      action.map[assertKey(key)] = value as ValueType;
    }
    return action;
  }

  /**
   * Creates multiple `ActionInput` instances from an array of objects.
   *
   * @param objs - An array of objects from which to create `ActionInput` instances.
   * @returns An array of `ActionInput` instances.
   */

  public static fromObjects<T extends {}>(objs: T[]): ActionInput[] {
    const actions: ActionInput[] = [];
    for (const obj of objects.requireNonNil(objs)) {
      actions.push(ActionInput.fromObject(obj));
    }
    return actions;
  }
}

/**
 * Asserts that a key is not null or undefined.
 *
 * @param key - The key to assert.
 * @returns The key if it is not null or undefined.
 * @throws Will throw an error if the key is null or undefined.
 */

function assertKey(key: string): string {
  return objects.requireNonNil(key, 'key cannot be nil');
}
