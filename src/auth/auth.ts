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
import { BytesEncodingStatus, EnvironmentType, PayloadType, VarType } from '../core/enums';
import { objects } from '../utils/objects';
import { AuthBody, executeSign } from '../core/signature';
import { bytesToHex, hexToBytes, stringToBytes } from '../utils/serial';
import { base64ToBytes, bytesToBase64 } from '../utils/base64';
import { ActionBody, Entries, transformActionInput } from '../core/action';
import { sha256BytesToBytes } from '../utils/crypto';
import { UnencodedActionPayload } from '../core/payload';
import { encodeActionCall } from '../utils/kwilEncoding';
import { AccessModifier } from '../transaction/action';
import ActionValidator from '../utils/actionValidator';

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

  public constructor(authClient: AuthClient, kwilProvider: string, chainId: string) {
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
   * @param {ActionBody} actionBody - The body of the action to send. This should use the `ActionBody` interface.
   * @returns A promise that resolves a privateSignature => privateSignature = {sig: string (Base64), type: AnySignatureType}
   */

  public async authenticatePrivateMode(
    actionBody: ActionBody,
    signer: KwilSigner
  ): Promise<AuthBody> {
    // get Challenge
    const challenge = await this.authClient.challengeClient();
    let msgChallenge = challenge.data as string;

    // Check if challenge.data is undefined
    if (!msgChallenge) {
      throw new Error('Challenge data is undefined. Something went wrong.');
    }

    // Check if multiple inputs were provided
    if (actionBody.inputs && actionBody.inputs.length > 1) {
      throw new Error(
        'Only one input is allowed for call requests. Please pass only one input and try again.'
      );
    }

    // ActionInput[] is deprecated. So we are converting any ActionInput[] to an Entries[]
    let inputs: Entries[] = [];
    if (actionBody.inputs && transformActionInput.isActionInputArray(actionBody.inputs)) {
      // For a call only one entry is allowed, so we only need to convert the first ActionInput
      inputs = transformActionInput.toSingleEntry(actionBody.inputs);
    } else if (actionBody.inputs) {
      inputs = actionBody.inputs;
    }

    // retrieve the schema and run validations
    const { namespace, actionName, encodedActionInputs, modifiers } =
      await ActionValidator.validateActionRequest(actionBody.namespace, actionBody.name, inputs);

    // throw a runtime error if more than one set of inputs is trying to be executed. Call does not allow bulk execution.
    if (encodedActionInputs && encodedActionInputs.length > 1) {
      throw new Error(
        'Cannot pass more than one input to the call endpoint. Please pass only one input and try again.'
      );
    }

    // throw runtime error if action is not a view action. transactions require a different payload structure than view actions.
    if (modifiers && modifiers.includes(AccessModifier.VIEW) === false) {
      throw new Error(`Action ${actionName} is not a view only action. Please use kwil.execute().`);
    }

    // construct payload. If there are no prepared actions, then the payload is an empty array.
    const payload: UnencodedActionPayload<PayloadType.CALL_ACTION> = {
      dbid: namespace,
      action: actionName,
      arguments: encodedActionInputs[0], // 'Call' method is used for 'view actions' which require only one input
    };

    const encodedPayload = encodeActionCall(payload);
    const uInt8ArrayPayload = base64ToBytes(encodedPayload);

    const digest = sha256BytesToBytes(uInt8ArrayPayload).subarray(0, 20);
    const msg = generateSignatureText(
      actionBody.namespace,
      actionBody.name,
      bytesToHex(digest),
      msgChallenge
    );

    const signature = await executeSign(stringToBytes(msg), signer.signer, signer.signatureType);
    const sig = bytesToBase64(signature);

    const byteChallenge = hexToBytes(msgChallenge);
    const base64Challenge = bytesToBase64(byteChallenge); // Challenge needs to be Base64 in the message

    const res = {
      signature: sig,
      challenge: base64Challenge,
    };

    return res;
  }

  public async logoutKGW(signer?: KwilSigner): Promise<GenericResponse<LogoutResponse<T>>> {
    const identifier = signer?.identifier || undefined;
    return await this.authClient.logoutClient(identifier);
  }
}
