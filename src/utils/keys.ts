import { hexToBytes } from './serial';
import { AccountKeyType } from '../core/enums';

export function inferKeyType(owner: string | Uint8Array): AccountKeyType {
  if (typeof owner === 'string') {
    owner = hexToBytes(owner);
  }

  if (owner.length === 32) {
    return AccountKeyType.ED25519;
  }

  if (owner.length === 20) {
    return AccountKeyType.SECP256K1;
  }

  throw new Error('Cannot determine key type from owner.');
}