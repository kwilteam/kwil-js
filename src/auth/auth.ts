import { GenericResponse } from '../core/resreq';
import { KwilSigner } from '../core/kwilSigner';
import {
  AuthSuccess,
  AuthenticatedBody,
  KGWAuthInfo,
  LogoutResponse,
  composeAuthMsg,
  generateSignatureText,
  removeTrailingSlash,
  verifyAuthProperties,
} from '../core/auth';
import {
  BytesEncodingStatus,
  EnvironmentType,
  PayloadType,
  ValueType,
  VarType,
} from '../core/enums';
import { objects } from '../utils/objects';
import { AuthBody, executeSign } from '../core/signature';
import { bytesToHex, hexToBytes, stringToBytes } from '../utils/serial';
import { base64ToBytes, bytesToBase64 } from '../utils/base64';
import { ActionBodyNode } from '../core/action';
import { sha256BytesToBytes } from '../utils/crypto';
import { kwilEncode } from '../utils/rlp';
import { DataType } from '../core/database';
import { EncodedValue, UnencodedActionPayload } from '../core/payload';

interface AuthClient {
  getAuthenticateClient(): Promise<GenericResponse<KGWAuthInfo>>;
  postAuthenticateClient<T extends EnvironmentType>(
    body: AuthenticatedBody<BytesEncodingStatus.HEX_ENCODED>
  ): Promise<GenericResponse<AuthSuccess<T>>>;
  logoutClient<T extends EnvironmentType>(
    identifier?: Uint8Array
  ): Promise<GenericResponse<LogoutResponse<T>>>;
  challengeClient(): Promise<GenericResponse<string>>;
}

export class Auth<T extends EnvironmentType> {
  private authClient: AuthClient;
  private kwilProvider: string;
  private chainId: string;

  public constructor(
    authClient: AuthClient,
    kwilProvider: string,
    chainId: string,
    challenge?: string
  ) {
    this.authClient = authClient;
    this.kwilProvider = kwilProvider;
    this.chainId = chainId;
  }

  /**
   * Authenticates a user with the Kwil Gateway (KGW). This is required to execute view actions with the `@kgw(authn='true')` annotation.
   *
   * This method should only be used if your Kwil Network is using the Kwil Gateway.
   *
   * @param {KwilSigner} signer - The signer for the authentication.
   * @returns A promise that resolves to the authentication success or failure.
   */
  public async authenticateKGW(signer: KwilSigner): Promise<GenericResponse<AuthSuccess<T>>> {
    // KGW rpc call
    const authParam = await this.authClient.getAuthenticateClient();

    const authProperties = objects.requireNonNil(
      authParam.data,
      'something went wrong retrieving auth info from KGW'
    );

    const domain = removeTrailingSlash(this.kwilProvider);
    const version = '1';

    verifyAuthProperties(authProperties, domain, version, this.chainId);

    const msg = composeAuthMsg(authProperties, domain, version, this.chainId);

    const signature = await executeSign(stringToBytes(msg), signer.signer, signer.signatureType);

    const authBody: AuthenticatedBody<BytesEncodingStatus.HEX_ENCODED> = {
      nonce: authProperties.nonce,
      sender: bytesToHex(signer.identifier),
      signature: {
        sig: bytesToBase64(signature),
        type: signer.signatureType,
      },
    };

    // KGW rpc call
    const res = await this.authClient.postAuthenticateClient(authBody);

    return res;
  }

  /**
   * Authenticates a user in private mode.
   *
   * This method should only be used if your Kwil Network is in private mode.
   *
   * @param {KwilSigner} signer - The signer for the authentication.
   * @returns A promise that resolves a privateSignature => privateSignature = {sig: string (Base64), type: AnySignatureType}
   */
  public async authenticatePrivateMode(
    signer: KwilSigner,
    actionBody: ActionBodyNode
  ): Promise<AuthBody> {
    // get Challenge
    const challenge = await this.authClient.challengeClient();
    let msgChallenge = challenge.data as string;

    // create payload
    const payload: UnencodedActionPayload<PayloadType.CALL_ACTION> = {
      dbid: actionBody.dbid,
      action: actionBody.name,
      arguments: actionBody?.inputs
        ? this.constructEncodedValues([Object.values(actionBody?.inputs[0])])[0]
        : [],
    };

    const encodedPayload = kwilEncode(payload);
    const base64Payload = bytesToBase64(encodedPayload);

    // create the digest, which is the first bytes of the sha256 hash of the rlp-encoded payload
    const uInt8ArrayPayload = base64ToBytes(base64Payload);
    const digest = sha256BytesToBytes(uInt8ArrayPayload).subarray(0, 20);
    const msg = generateSignatureText(
      actionBody.dbid,
      actionBody.name,
      bytesToHex(digest),
      msgChallenge
    );

    const signature = await executeSign(stringToBytes(msg), signer.signer, signer.signatureType);
    const sig = await bytesToBase64(signature);

    const privateSignature = {
      sig: sig,
      type: signer.signatureType,
    };

    const byteChallenge = hexToBytes(msgChallenge);
    const base64Challenge = bytesToBase64(byteChallenge); // Challenge needs to be Base64 in the message

    const res = {
      signature: privateSignature,
      challenge: base64Challenge,
    };
    return res;
  }

  public async logout(signer?: KwilSigner): Promise<GenericResponse<LogoutResponse<T>>> {
    const identifier = signer?.identifier || undefined;
    return await this.authClient.logoutClient(identifier);
  }

  /**
   * Constructs encoded values based on actions given to it
   *
   * @param {ValueType[][]} preparedActions - The values of the actions to be executed.
   * @returns {EncodedValue[][]} - An array of arrays of values to be executed.
   */
  public constructEncodedValues(preparedActions: ValueType[][]): EncodedValue[][] {
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
}

function analyzeNumber(num: number) {
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
