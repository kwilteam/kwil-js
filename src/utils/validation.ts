import { objects } from './objects';
import { NonNil } from './types';

/**
 * Helper function to validate required fields with a standard error message format.
 * @param values An object containing field names and their corresponding values.
 * @param errorMessageTemplate A function to generate error messages dynamically.
 */
export const validateFields = <T extends Record<string, unknown>>(
    values: T,
    errorMessageTemplate: (fieldName: keyof T) => string
  ): { [K in keyof T]: NonNil<T[K]> } => {
    const validatedFields = {} as { [K in keyof T]: NonNil<T[K]> };
    for (const [fieldName, value] of Object.entries(values)) {
      validatedFields[fieldName as keyof T] = objects.requireNonNil(
        value,
        errorMessageTemplate(fieldName as keyof T)
      ) as NonNil<T[typeof fieldName]>;
    }
    return validatedFields;
  };
  
