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
