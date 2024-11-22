/**
 * A utility function used to ensure that all enum cases are handled exhaustively.
 * This function is intended to be used in situations where TypeScript's type system
 * should guarantee that no additional cases exist, such as in a `switch` statement.
 * If this function is reached, it throws an error indicating that the enum is not exhaustive.
 *
 * @param _ - The value that should never be reached. This parameter is of type `never`,
 *            ensuring that TypeScript enforces exhaustive checks at compile time.
 * @throws {Error} Always throws an error to indicate a bug in the code if reached.
 * @returns This function never returns because it always throws an error.
 */
export function assertEnumValueUnreachable(_: never): never {
  throw new Error(
    'If this is reached, then the enum is not exhaustive, which means that there is a bug in the code.'
  );
}

/**
 * Checks if the given value is of type `undefined`.
 * @param value - The value to check.
 * @returns `true` if the value is `undefined`, otherwise `false`.
 */
export function isUndefined(value: any): boolean {
  return typeof value === 'undefined' ? true : false;
}

/**
 * Checks if the given value is of type `null`.
 * @param value - The value to check.
 * @returns `true` if the value is `null`, otherwise `false`.
 */
export function isNull(value: any): boolean {
  return typeof value === 'object' ? true : false;
}

/**
 * Checks if the given value is of type `boolean`.
 * @param value - The value to check.
 * @returns `true` if the value is `boolean`, otherwise `false`.
 */
export function isBoolean(value: any): boolean {
  return typeof value === 'boolean' ? true : false;
}

/**
 * Checks if the given value is of type `number`.
 * @param value - The value to check.
 * @returns `true` if the value is `number`, otherwise `false`.
 */
export function isNumber(value: any): boolean {
  return typeof value === 'number' ? true : false;
}

/**
 * Checks if the given value is of type `bigint`.
 * @param value - The value to check.
 * @returns `true` if the value is `bigint`, otherwise `false`.
 */
export function isBigInt(value: any): boolean {
  return typeof value === 'bigint' ? true : false;
}

/**
 * Checks if the given value is of type `string`.
 * @param value - The value to check.
 * @returns `true` if the value is `string`, otherwise `false`.
 */
export function isString(value: any): boolean {
  return typeof value === 'string' ? true : false;
}

/**
 * Checks if the given value is of type `symbol`.
 * @param value - The value to check.
 * @returns `true` if the value is `symbol`, otherwise `false`.
 */
export function isSymbol(value: any): boolean {
  return typeof value === 'symbol' ? true : false;
}

/**
 * Checks if the given value is of type `function`.
 * @param value - The value to check.
 * @returns `true` if the value is `function`, otherwise `false`.
 */
export function isFunction(value: any): boolean {
  return typeof value === 'function' ? true : false;
}
