import { DataType } from '../core/database';
import { ValueType, VarType } from '../core/enums';
import { EncodedValue } from '../core/payload';
import { bytesToBase64 } from './base64';
import { booleanToBytes, numberToBytes, stringToBytes } from './serial';
import { convertUuidToBytes, isUuid } from './uuid';

/**
 *
 * @param {ValueType[]} values - An array of values to be executed by an action.
 * @returns formatted values used for an action
 */
export function formatArguments(values: ValueType[]): EncodedValue[] {
  // TODO: Need to test and implement this method.
  // Used in authenticatePrivateMode() in auth.ts
  return values.map(formatDataType);
}

export function encodeParameters(params: Record<string, ValueType>): Record<string, EncodedValue> {
  const formattedParams: Record<string, EncodedValue> = {};

  Object.entries(params).forEach(([key, value]) => {
    formattedParams[key] = formatDataType(value);
  });

  return formattedParams;
}

function formatDataType(val: ValueType): EncodedValue {
  const { metadata, varType } = resolveValueType(val);

  const metadataSpread = metadata ? { metadata } : {};

  const dataType: DataType = {
    name: varType,
    is_array: Array.isArray(val),
    ...metadataSpread,
  };

  let data = val;

  // TODO: Implement and test array of values
  if (Array.isArray(val) && !(val instanceof Uint8Array)) {
    data = val.map((v) => {
      return v?.toString() || '';
    });
  }

  return {
    type: dataType,
    data: encodeValue(varType, data),
  };
}

export function encodeValue(type: VarType, data: ValueType): string[] {
  if (data === undefined || data === null) {
    return [''];
  }

  switch (type) {
    case VarType.UUID:
      const uuidBytes = convertUuidToBytes(data.toString());
      return [bytesToBase64(uuidBytes)];
    case VarType.INT8:
    case VarType.INT:
      return [bytesToBase64(numberToBytes(Number(data)))];
    case VarType.BOOL:
      return [bytesToBase64(booleanToBytes(Boolean(data)))];
    case VarType.BYTEA:
    case VarType.BLOB:
      if (!(data instanceof Uint8Array)) {
        throw new Error(
          'Unexpected BLOB data type. If using a blob, please convert to a JavaScript Uint8Array.'
        );
      }
      return [bytesToBase64(data)];
    case VarType.DECIMAL:
    case VarType.NUMERIC:
      return [bytesToBase64(stringToBytes(data.toString()))];
    default:
      return [bytesToBase64(stringToBytes(data.toString()))];
  }
}

export function analyzeNumber(num: number) {
  // Convert the number to a string and handle potential negative sign
  const numStr = Math.abs(num).toString();

  const decimalIndex = numStr.indexOf('.');
  const hasDecimal = decimalIndex !== -1;

  // Calculate total digits (excluding the decimal point)
  const totalDigits = hasDecimal ? numStr.length - 1 : numStr.length;

  return {
    hasDecimal: hasDecimal,
    totalDigits: totalDigits,
    decimalPosition: hasDecimal ? decimalIndex : -1,
  };
}

function resolveValueType(value: ValueType): {
  metadata: [number, number] | undefined;
  varType: VarType;
} {
  if (Array.isArray(value)) {
    // In Kwil, if there is an array of values, each value in the array must be of the same type.
    return resolveValueType(value[0]);
  }

  let metadata: [number, number] | undefined;
  // Default to text string
  // Only other types are null or blob. For client-side tooling, everything else can be sent as a string, and Kwil will handle the conversion.
  let varType: VarType = VarType.TEXT;

  switch (typeof value) {
    case 'string':
      if (isUuid(value)) {
        varType = VarType.UUID;
      }

      break;
    case 'number':
      const numAnalysis = analyzeNumber(value);
      if (numAnalysis.hasDecimal) {
        metadata = [numAnalysis.totalDigits, numAnalysis.decimalPosition];
        varType = VarType.NUMERIC;
      } else {
        varType = VarType.INT8;
      }
      break;
    case 'boolean':
      varType = VarType.BOOL;
      break;
    case 'object':
      if (value instanceof Uint8Array) {
        varType = VarType.BYTEA;
        break;
      }
      if (value === null) {
        varType = VarType.NULL;
        break;
      }
    case 'undefined':
      varType = VarType.NULL;
      break;
    default:
      throw new Error(
        `Unsupported type: ${typeof value}. If using a uuid, blob, or uint256, please convert to a JavaScript string.`
      );
  }

  return {
    metadata,
    varType,
  };
}
