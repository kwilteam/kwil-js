import { DataType } from '../core/database';
import { VarType } from '../core/enums';
import { EncodedParameterValue, EncodedValue } from '../core/payload';
import { bytesToBase64 } from './base64';
import { encodeValue } from './kwilEncoding';
import { EncodedQueryParams, QueryParams, ValueType } from './types';
import { isUuid } from './uuid';

/**
 *
 * @param {ValueType[]} values - An array of input values to be executed by an action.
 * @returns formatted values used for an action
 */
// TODO: Add comments about usage of this function
export function encodeActionInputs(values: ValueType[]): EncodedValue[] {
  return values.map((val) => formatEncodedValue(val));
}

// TODO: Add comments about usage of this function
export function encodeParameters(params: QueryParams): EncodedQueryParams {
  const encodedParams: EncodedQueryParams = {};
  Object.entries(params).forEach(([key, value]) => {
    encodedParams[key] = formatEncodedParameterValue(value);
  });
  return encodedParams;
}

export function encodeRawStatementParameters(params: QueryParams) {
  return Object.entries(params).map(([key, value]) => ({
    name: key,
    value: formatEncodedValue(value),
  }));
}

function formatDataTypeBase(val: ValueType): {
  type: DataType;
  data: ValueType;
} {
  const { metadata, varType } = resolveValueType(val);
  const metadataSpread = metadata ? { metadata } : {};

  const dataType: DataType = {
    name: varType,
    is_array: Array.isArray(val),
    ...metadataSpread,
  };

  return { type: dataType, data: val };
}

// TODO: Add comments about usage of this function
function formatEncodedParameterValue(val: ValueType): EncodedParameterValue {
  const base = formatDataTypeBase(val);
  return {
    type: base.type,
    data: [bytesToBase64(encodeValue(base.data))],
  };
}

// TODO: Add comments about usage of this function i.e. what is the difference between formatEncodedParameterValue and formatEncodedValue
function formatEncodedValue(val: ValueType): EncodedValue {
  const base = formatDataTypeBase(val);
  return {
    type: base.type,
    data: [encodeValue(base.data)],
  };
}

export function analyzeNumber(num: number) {
  // Convert the number to a string and handle potential negative sign
  const numStr = Math.abs(num).toString();

  const decimalIndex = numStr.indexOf('.');
  const hasDecimal = decimalIndex !== -1;

  // Precision represents the total number of digits (excluding the decimal point)
  const precision = hasDecimal ? numStr.length - 1 : numStr.length;
  // Scale represents the number of digits after the decimal point
  const scale = hasDecimal ? numStr.length - decimalIndex - 1 : 0;

  // e.g. 123.456
  // precision = 6
  // scale = 3

  return {
    hasDecimal,
    precision,
    scale,
  };
}

export function resolveValueType(value: ValueType): {
  metadata: [number, number] | undefined;
  varType: VarType;
} {
  if (Array.isArray(value)) {
    // In Kwil, if there is an array of values, each value in the array must be of the same type.
    return resolveValueType(value[0]);
  }

  let metadata: [number, number] = [0, 0];
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

      return {
        metadata: [numAnalysis.precision, numAnalysis.scale],
        varType: numAnalysis.hasDecimal ? VarType.NUMERIC : VarType.INT8,
      };
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
