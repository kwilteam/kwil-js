import Client from '../api_client/client';
import { GenericResponse } from '../core/resreq';
import { KwilSigner } from '../core/kwilSigner';
import { AuthSuccess, AuthenticatedBody, LogoutResponse, composeAuthMsg, removeTrailingSlash, verifyAuthProperties } from '../core/auth';
import { BytesEncodingStatus, EnvironmentType } from '../core/enums';
import { objects } from '../utils/objects';
import { executeSign } from '../core/signature';
import { stringToBytes } from '../utils/serial';
import { bytesToBase64 } from '../utils/base64';

export class Auth<T extends EnvironmentType> {
  private client: Client;
  private kwilProvider: string;
  private chainId: string;

  public constructor(client: Client, kwilProvider: string, chainId: string) {
    this.client = client;
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
  public async authenticate(signer: KwilSigner): Promise<GenericResponse<AuthSuccess<T>>> {
    const authParam = await this.client.getAuthenticate();

    const authProperties = objects.requireNonNil(
      authParam.data,
      'something went wrong retrieving auth info from KGW'
    );

    const domain = removeTrailingSlash(this.kwilProvider);
    const version = '1';

    verifyAuthProperties(authProperties, domain, version, this.chainId);

    const msg = composeAuthMsg(authProperties, domain, version, this.chainId);

    const signature = await executeSign(stringToBytes(msg), signer.signer, signer.signatureType);

    const authBody: AuthenticatedBody<BytesEncodingStatus.BASE64_ENCODED> = {
      nonce: authProperties.nonce,
      sender: bytesToBase64(signer.identifier),
      signature: {
        signature_bytes: bytesToBase64(signature),
        signature_type: signer.signatureType,
      },
    };

    const res = await this.client.postAuthenticate(authBody);

    return res;
  }

  public async logout(): Promise<GenericResponse<LogoutResponse<T>>> {
    return await this.client.logout();
  }
}
