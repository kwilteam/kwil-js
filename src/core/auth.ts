import { Base64String } from '../utils/types';
import { BytesEncodingStatus, EnvironmentType } from './enums';
import { Signature } from './signature';

export interface AuthenticatedBody<
  T extends BytesEncodingStatus.BASE64_ENCODED | BytesEncodingStatus.UINT8_ENCODED
> {
  nonce: string;
  sender: Base64String;
  signature: Signature<T>;
}

export interface AuthInfo {
  nonce: string;
  statement: string;
  issue_at: string;
  expiration_time: string;
}

export type AuthSuccess<T extends EnvironmentType> = T extends EnvironmentType.BROWSER ? BrowserAuthSuccess : NodeAuthSuccess; 

interface BrowserAuthSuccess {
  result: string;
}

interface NodeAuthSuccess {
  result: string;
  cookie?: string;
}

export type LogoutResponse<T extends EnvironmentType> = T extends EnvironmentType.BROWSER ? LogoutResponseWeb : LogoutResponseNode;

interface LogoutResponseWeb {
  result: string;
}

interface LogoutResponseNode {
  result: string;
  cookie?: string;
}

export function composeAuthMsg(
  authParam: AuthInfo,
  domain: string,
  version: string,
  chainId: string,
): string {
  const target = new URL('auth', domain);
  let msg = '';
  msg += `${domain} wants you to sign in with your account:\n`;
  msg += `\n`;
  if (authParam.statement !== '') {
    msg += `${authParam.statement}\n`;
  }
  msg += '\n';
  msg += `URI: ${target.href}\n`;
  msg += `Version: ${version}\n`;
  msg += `Chain ID: ${chainId}\n`;
  msg += `Nonce: ${authParam.nonce}\n`;
  msg += `Issue At: ${authParam.issue_at}\n`;
  msg += `Expiration Time: ${authParam.expiration_time}\n`;
  return msg;
}
