import { WebKwil } from "../../../src";

export const kwil = new WebKwil({
    kwilProvider: "http://localhost:8484",
    chainId: "kwil-chain-DpKylppR",
    logging: true,
    timeout: 10000
})