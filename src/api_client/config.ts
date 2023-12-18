// config for api

type seconds = number;

export interface ApiConfig {
  kwilProvider: string;
  unconfirmedNonce?: boolean;
  timeout?: number;
  logging?: boolean;
  logger?: Function;
  cache?: seconds;
}

export interface NetworkConfig {
    chainId: string;
}

/**
 * @typedef {Object} Config
 * @property {string} kwilProvider - kwil provider url
 * @property {string} chainId - chain id
 * @property {boolean} [unconfirmedNonce] - use unconfirmed nonce
 * @property {number} [timeout] - timeout for requests in milliseconds
 * @property {boolean} [logging] - enable logging
 * @property {Function} [logger] - custom logger function
 * @property {number} [cache] - Time to live cache in seconds. Only getSchema requests are cached. Default is 10 minutes.
 */
export type Config = ApiConfig & NetworkConfig;