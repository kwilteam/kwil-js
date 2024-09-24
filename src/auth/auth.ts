import { GenericResponse } from '../core/resreq';
import { KwilSigner } from '../core/kwilSigner';
import {
  AuthInfo,
  AuthSuccess,
  AuthenticatedBody,
  LogoutResponse,
  PrivateModeAuthInfo,
  composeAuthMsg,
  generateSignatureText,
  removeTrailingSlash,
  verifyAuthProperties,
} from '../core/auth';
import { BytesEncodingStatus, EnvironmentType } from '../core/enums';
import { objects } from '../utils/objects';
import { executeSign } from '../core/signature';
import { bytesToHex, stringToBytes } from '../utils/serial';
import { bytesToBase64 } from '../utils/base64';
import { BaseMessage, Message } from '../core/message';
import { ActionBodyNode } from '../core/action';
import { sha256BytesToBytes } from '../utils/crypto';
import { sign } from 'crypto';

interface AuthClient {
  getAuthenticateClient(): Promise<GenericResponse<AuthInfo>>;
  postAuthenticateClient<T extends EnvironmentType>(
    body: AuthenticatedBody<BytesEncodingStatus.HEX_ENCODED>
  ): Promise<GenericResponse<AuthSuccess<T>>>;
  logoutClient<T extends EnvironmentType>(identifier?: Uint8Array): Promise<GenericResponse<LogoutResponse<T>>>;
}

export class Auth<T extends EnvironmentType> {
  private authClient: AuthClient;
  private kwilProvider: string;
  private chainId: string;
  private challenge?: string;

  public constructor(authClient: AuthClient, kwilProvider: string, chainId: string, challenge?: string) {
    this.authClient = authClient;
    this.kwilProvider = kwilProvider;
    this.chainId = chainId;
    this.challenge = challenge;
  }

  /**
   * Authenticates a user with the Kwil Gateway (KGW). This is required to execute view actions with the `@kgw(authn='true')` annotation.
   *
   * This method should only be used if your Kwil Network is using the Kwil Gateway.
   *
   * @param {KwilSigner} signer - The signer for the authentication.
   * @returns A promise that resolves to the authentication success or failure.
   */
  public async authenticate(signer: KwilSigner): Promise<GenericResponse<AuthSuccess<T>>> {
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

    const res = await this.authClient.postAuthenticateClient(authBody);

    return res;
  }

  public async privateModeAuthenticate(signer: KwilSigner, actionBody: ActionBodyNode, challenge: string, payload: string): Promise<string> {

    const authParam = await this.authClient.getAuthenticateClient();
    console.log(authParam.data?.nonce)

    const authProperties = objects.requireNonNil(
      authParam.data,
      'something went wrong retrieving auth info from KGW'
    );
    // create the digest, which is the first bytes of the sha256 hash of the rlp-encoded payload
    const uInt8ArrayPayload = stringToBytes(payload)
    const digest = sha256BytesToBytes(uInt8ArrayPayload).subarray(0, 20);
    const msg = generateSignatureText(actionBody.dbid, actionBody.name, digest, challenge)

    const signature = await executeSign(stringToBytes(msg), signer.signer, signer.signatureType);
    const sig = await bytesToBase64(signature)
    const sender = await bytesToHex(signer.identifier)

    // ??????
    const authBody: AuthenticatedBody<BytesEncodingStatus.HEX_ENCODED> = {
      challenge: challenge,
      nonce: authProperties.nonce,
      sender: sender,
      signature: {
        sig: sig,
        type: signer.signatureType,
      },
    };

    const res = await this.authClient.postAuthenticateClient(authBody);
    
    return sig;
  }

  public async logout(signer?: KwilSigner): Promise<GenericResponse<LogoutResponse<T>>> {
    const identifier = signer?.identifier || undefined;
    return await this.authClient.logoutClient(identifier);
  }
}
