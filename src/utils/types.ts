import {NillableError, objects} from "./objects";

export type NonNil<T> = T extends null | undefined ? never : T;
export type Nillable<T> = T | null | undefined;
export type Supplier<T> = () => T;
export type Lazy<T> = (() => Promise<T>) | (() => T);
export type Func<T, U> = (t: T) => U;
export type Unary<T> = Func<T, T>;
export type Runnable = () => void;
export type NonFunction<T> = T extends Function ? never : T;

export type Promisy<T> =
    T extends null | undefined ? never :
        T extends (() => infer R) | (() => Awaited<infer R>) ?
                T : T extends Function ? never : T;

export namespace Promisy {
    // If promisy is null or undefined, throws NillableError, else
    // returns value from Promisy.
    export async function resolve<T>(promisy: Promisy<T>): Promise<T> {
        const fov = objects.requireNonNil(promisy);
        const awaitable = typeof fov === "function" ? fov() : fov;
        return await awaitable;
    }

    // If promisy is null or undefined, returns a rejected
    // Promise else returns result of resolve(promisy)
    export async function resolveOrReject<T>(promisy: Nillable<Promisy<T>>): Promise<T> {
        return objects.isNil(promisy) ?
            Promise.reject<T>(new NillableError()) :
            resolve(promisy as Promisy<T>);
    }
}

export namespace Lazy {
    export function of<T>(promisy: Promisy<T>): Lazy<T> {
        return (): Promise<T> => {
            const fn = objects.requireNonNil(promisy);
            return typeof fn === "function" ? fn() : fn;
        }
    }
}