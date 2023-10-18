import {NonNil} from "./types";

const NillablErrorSymbol = Symbol();
const NILL_ERROR_MESSAGE = 'value cannot be null or undefined';

export class NillableError extends Error {
    public constructor(message: NonNil<string> = NILL_ERROR_MESSAGE) {
        super((message as any) || NILL_ERROR_MESSAGE);
    }

    private get [NillablErrorSymbol]() {
        return true;
    }
}

export const objects = {
    isNilError: (error: Error): boolean => {
        return (error as NillableError)[NillablErrorSymbol] === true;
    },
    // returns true if the value is null or undefined,
    // else will return false.
    isNil: <T>(value: T): boolean => {
        return value === null || value === undefined;
    },
    // returns false if the value is null or undefined,
    // else will return true.
    isNotNil: <T>(value: T): boolean => {
        return !objects.isNil(value);
    },
    // If value is null or undefined, then an error is thrown, else
    // value is returned.
    requireNonNil: <T>(value: T, message?: string | ((v: T) => Error)): NonNil<T> => {
        if (!objects.isNil(value)) {
            return value as NonNil<T>;
        }

        if (typeof message === 'function') {
            throw message(value);
        }

        throw new NillableError(message);
    },
    // If value is null or undefined, then an error is thrown, else
    // value is returned.
    requireNonNilNumber: <T>(value: T, message?: string | ((v: T) => Error)): NonNil<number> => {
        if (typeof value === 'number') {
            return value;
        }

        if (typeof message === 'function') {
            throw message(value);
        }

        if (!value) {
            throw new NillableError(message);
        }

        throw new Error("value is not a number, it is a " + typeof value);
    },
};

