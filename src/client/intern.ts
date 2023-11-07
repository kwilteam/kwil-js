import { Transaction } from '../core/tx';
import { GenericResponse } from '../core/resreq';
import { Kwil } from './kwil';
import { objects } from '../utils/objects';
import { Config } from '../api_client/config';

const estimateKey = Symbol('estimate');

export function unwrapEstimate<T>(
  kwil: Kwil
): (tx: Transaction) => Promise<GenericResponse<string>> {
  objects.requireNonNil(kwil);
  return objects.requireNonNil((kwil as any)[estimateKey]);
}

export function wrapEstimate<T>(
  kwil: Kwil,
  method: (tx: Transaction) => Promise<GenericResponse<string>>
): void {
  objects.requireNonNil(kwil);
  (kwil as any)[estimateKey] = method;
}

const configKey = Symbol('config');

export function unwrapConfig(kwil: Kwil): Config {
  objects.requireNonNil(kwil);
  return objects.requireNonNil((kwil as any)[configKey]);
}

export function wrapConfig(kwil: Kwil, config: Config): void {
  objects.requireNonNil(kwil);
  (kwil as any)[configKey] = config;
}
