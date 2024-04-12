import { WebKwil } from "../../../src";

export const kwil = new WebKwil({
    kwilProvider: "https://kgw-dev.kwil.com",
    chainId: "kwil-chain-9",
    logging: true,
    timeout: 10000
})