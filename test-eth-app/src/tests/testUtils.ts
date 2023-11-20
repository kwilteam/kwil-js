import { WebKwil } from "../../../src/index";

export const kwil = new WebKwil({
    kwilProvider: "http://localhost:8090",
    chainId: "kwil-test-chain",
    logging: true,
    timeout: 10000
})