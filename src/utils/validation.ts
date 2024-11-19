import { objects } from './objects';

export async function validateField<T>(
  value: T | Promise<T> | null | undefined,
  fieldName: string
): Promise<T> {
  const errorMessage = `${fieldName} cannot be null or undefined. Please specify a ${fieldName}.`;

  return objects.requireNonNil(value, errorMessage);
}
