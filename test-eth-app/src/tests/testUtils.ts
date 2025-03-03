import { WebKwil } from '../../../src';

console.log(import.meta.env.VITE_KWIL_PROVIDER);
console.log(import.meta.env.VITE_CHAIN_ID);

export const kwil = new WebKwil({
  kwilProvider: import.meta.env.VITE_KWIL_PROVIDER || 'http://localhost:8090',
  chainId: import.meta.env.VITE_CHAIN_ID || 'kwil-testnet',
  logging: true,
  timeout: 10000,
});
