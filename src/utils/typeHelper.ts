export function assertEnumValueUnreachable(_: never): never {
    throw new Error("If this is reached, then the enum is not exhaustive, which means that there is a bug in the code.");
}