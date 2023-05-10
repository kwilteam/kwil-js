import {objects} from "./objects";

export type NonNil<T> = T extends null | undefined ? never : T;
export type Nillable<T> = T | null | undefined;
export type Supplier<T> = () => T;
export type Func<T, U> = (t: T) => U;
export type Unary<T> = Func<T, T>;
export type Runnable = () => void;
export type Promisy<T> = NonFunction<T> | (() => T) | (() => Promise<T>);
export type NonFunction<T> = T extends Function ? never : T;

export async function awaitable<T>(promisy: Promisy<T>): Promise<T> {
    const fn = objects.requireNonNil(promisy);

    if (typeof fn !== "function") {
        return fn;
    }

    const result = objects.requireNonNil((fn as any)());
    if (!(result instanceof Promise)) {
        return result;
    }

    return result;
}
