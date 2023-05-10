import {NonNil} from "./types";

export const objects = {
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
            // @ts-ignore: Unreachable code error
            return value;
        }

        if (typeof message === 'function') {
            throw message(value);
        }

        throw new Error(message || 'value cannot be null or undefined');
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

        throw new Error("value is not a number, it is a " + (!value ? 'null or undefined' : typeof value));
    },
};

