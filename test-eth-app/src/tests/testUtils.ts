import { WebKwil } from "@lukelamey/kwil-js";

export const kwil = new WebKwil({
    kwilProvider: "http://kwil.dev:8090",
    chainId: "kwil-test-chain",
    logging: true,
    timeout: 10000
})