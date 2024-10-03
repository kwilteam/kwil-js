import { HexString, NonNil } from './types';
import { concatBytes, numberToUint16BigEndian, uint16BigEndianToNumber } from './bytes';
import { bytesToEthHex, hexToBytes, numberToEthHex, stringToEthHex, hexToString } from './serial';
import { RlpStructuredData, decodeRlp, encodeRlp } from 'ethers';
import { EncodingType, ValueType, VarType } from '../core/enums';
import { EncodedValue } from '../core/payload';
import { DataType } from '../core/database';
import { ActionBody } from '../core/action';

function _objToNestedArray(input: NonNil<object>): any[] | HexString {
  if (Array.isArray(input) && !(input instanceof Uint8Array)) {
    return input.map((item) => _objToNestedArray(item));
  } else if (typeof input === 'object' && input !== null && !(input instanceof Uint8Array)) {
    const entries = Object.entries(input);
    const structured: RlpStructuredData[] = [];
    for (const [_, value] of entries) {
      structured.push(_objToNestedArray(value));
    }
    return structured;
  } else {
    return inputToHex(input);
  }
}

// takes any input and returns it as a hex string
function inputToHex(
  val: string | number | BigInt | Uint8Array | Boolean | null | undefined
): HexString {
  if (typeof val === 'string') {
    // Convert only non-hex strings to hex
    return stringToEthHex(val);
  } else if (typeof val === 'number' || typeof val === 'bigint') {
    const num = Number(val);
    if (num === 0) {
      return '0x'; // special case for RLP encoding 0
    }
    return numberToEthHex(num);
  } else if (val instanceof Uint8Array) {
    return bytesToEthHex(val);
  } else if (typeof val === 'boolean') {
    return val ? '0x01' : '0x';
  } else if (val === null || val === undefined) {
    return bytesToEthHex(new Uint8Array(0));
  } else {
    // Convert any other value to a string first
    throw new Error(`unknown type for value: ${val}`);
  }
}

export function kwilEncode(obj: NonNil<object>): Uint8Array {
  const rlp: RlpStructuredData = _objToNestedArray(obj);
  const rlpBytes: HexString = encodeRlp(rlp); // returned as hex string
  const encodingType: Uint8Array = numberToUint16BigEndian(EncodingType.RLP_ENCODING);
  return concatBytes(encodingType, hexToBytes(rlpBytes));
}

export function kwilDecode(encoding: Uint8Array): any {
  const encodingBytes: Uint8Array = encoding.slice(0, 2);
  const encodingType = uint16BigEndianToNumber(encodingBytes);

  // check if encoding type exists in the enum
  if (!Object.values(EncodingType).includes(encodingType)) {
    throw new Error(`unknown encoding type: ${encodingType}`);
  }

  const rlpBytes: Uint8Array = encoding.slice(2);
  const rlpHex: HexString = bytesToEthHex(rlpBytes);
  const rlp: RlpStructuredData = decodeRlp(rlpHex);

  return _recursivelyDeHexlify(rlp);
}

type KwilRlpDecoded = string | number | boolean;

function _recursivelyDeHexlify(obj: RlpStructuredData): KwilRlpDecoded | any[] {
  if (Array.isArray(obj)) {
    return obj.map((item) => {
      return _recursivelyDeHexlify(item);
    });
  }
  return _convertDecodedType(hexToString(obj));
}

function _convertDecodedType(val: string): KwilRlpDecoded {
  if (!isNaN(Number(val))) {
    return Number(val);
  }

  if (val === 'true') {
    return true;
  }

  if (val === 'false') {
    return false;
  }

  return val;
}

/**
 * Constructs encoded values based on actions given to it
 *
 * @param {ValueType[][]} preparedActions - The values of the actions to be executed.
 * @returns {EncodedValue[][]} - An array of arrays of values to be executed.
 */
export function constructEncodedValues(preparedActions: ValueType[][]): EncodedValue[][] {
  let encodedValues: EncodedValue[][] = [];

  // construct the encoded value
  preparedActions.forEach((action) => {
    let singleEncodedValues: EncodedValue[] = [];
    action.forEach((val) => {
      const { metadata, varType } = analyzeVariable(val);

      const metadataSpread = metadata ? { metadata } : {};

      const dataType: DataType = {
        name: varType,
        is_array: Array.isArray(val),
        ...metadataSpread,
      };

      let data: string[] | Uint8Array[] = [];

      if (Array.isArray(val) && !(val instanceof Uint8Array)) {
        data = val.map((v) => {
          return v?.toString() || '';
        });
      } else if (val instanceof Uint8Array) {
        data = [val];
      } else {
        data = [val?.toString() || ''];
      }

      singleEncodedValues.push({
        type: dataType,
        data,
      });
    });

    encodedValues.push(singleEncodedValues);
  });

  return encodedValues;
}

export function analyzeNumber(num: number) {
  // Convert the number to a string and handle potential negative sign
  const numStr = Math.abs(num).toString();

  // Check for the presence of a decimal point
  const decimalIndex = numStr.indexOf('.');
  const hasDecimal = decimalIndex !== -1;

  // Calculate total digits (excluding the decimal point)
  const totalDigits = hasDecimal ? numStr.length - 1 : numStr.length;

  // Analysis object to hold the results
  const analysis = {
    hasDecimal: hasDecimal,
    totalDigits: totalDigits,
    decimalPosition: hasDecimal ? decimalIndex : -1,
  };

  return analysis;
}

export function analyzeVariable(val: ValueType): {
  metadata: [number, number] | undefined;
  varType: VarType;
} {
  if (Array.isArray(val)) {
    // In Kwil, if there is an array of values, each value in the array must be of the same type.
    return analyzeVariable(val[0]);
  }

  let metadata: [number, number] | undefined;
  // Default to text string
  // Only other types are null or blob. For client-side tooling, everything else can be sent as a string, and Kwil will handle the conversion.
  let varType: VarType = VarType.TEXT;

  switch (typeof val) {
    case 'string':
      break;
    case 'number':
      const numAnalysis = analyzeNumber(val);
      if (numAnalysis.hasDecimal) {
        metadata = [numAnalysis.totalDigits, numAnalysis.decimalPosition];
      }
      break;
    case 'boolean':
      break;
    case 'object':
      if (val instanceof Uint8Array) {
        varType = VarType.BLOB;
        break;
      }
      if (val === null) {
        varType = VarType.NULL;
        break;
      }
    case 'undefined':
      varType = VarType.NULL;
      break;
    default:
      throw new Error(
        `Unsupported type: ${typeof val}. If using a uuid, blob, or uint256, please convert to a JavaScript string.`
      );
  }

  return {
    metadata,
    varType,
  };
}

/**
 *
 * @param {ActionBody} actionBody - The body of the action to send. This should use the `ActionBody` interface.
 * @returns - an array of values to be executed
 */
export function encodeArguments(actionBody: ActionBody): EncodedValue[] {
  // Extract inputs if available
  const inputs = actionBody?.inputs ? Object.values(actionBody.inputs[0]) : [];

  // Construct encoded values from inputs => (see src/utils/rlp.ts/constructEncodedValues above)
  const encodedArguments = inputs.length > 0 ? constructEncodedValues([inputs])[0] : [];
  return encodedArguments;
}
