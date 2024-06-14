import { WebKwil } from "@kwilteam/kwil-js";

export const kwil = new WebKwil({
    kwilProvider: "http://localhost:8080",
    chainId: "kwil-chain-amoeW1WD",
    logging: true,
    timeout: 10000
})