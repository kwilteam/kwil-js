import { WebKwil } from "../../../src/index";

export const kwil = new WebKwil({
    kwilProvider: "http://localhost:8080",
    chainId: "kwil-chain-r53LGJRw",
    logging: true,
    timeout: 10000
})