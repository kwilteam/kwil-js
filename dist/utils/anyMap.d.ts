export declare class AnyMap<T> {
    map: any;
    constructor();
    set(key: any, value: T): void;
    get(key: any): T;
    delete(key: any): void;
    values(): T[];
    forEach(callback: (value: T, key: any) => void): void;
    modifyAll(callback: (value: T) => T): void;
}
