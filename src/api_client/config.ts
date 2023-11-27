// config for api

type seconds = number;

/**
 * @typedef {Object} Config
 * @property {string} kwilProvider - kwil provider url
 * @property {number} [timeout] - timeout for requests in milliseconds
 * @property {string} [apiKey] - api key for kwil provider, if required (not required for public networks)
 * @property {boolean} [logging] - enable logging
 * @property {Function} [logger] - custom logger function
 * @property {number} [cache] - Time to live cache in seconds. Only getSchema requests are cached. Default is 10 minutes.
 */
export interface ApiConfig {
  kwilProvider: string;
  timeout?: number;
  apiKey?: string;
  logging?: boolean;
  logger?: Function;
  cache?: seconds;
}

export interface NetworkConfig {
    chainId: string;
}

export type Config = ApiConfig & NetworkConfig;