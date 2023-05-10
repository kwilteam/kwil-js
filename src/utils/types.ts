export type NonNil<T> = T extends null | undefined ? never : T;
export type Nillable<T> = T | null | undefined;
export type Supplier<T> = () => T;
export type Func<T, U> = (t: T) => U;
export type Unary<T> = Func<T, T>;
export type Runnable = () => void;

