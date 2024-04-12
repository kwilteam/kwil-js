import { WebKwil } from "@lukelamey/kwil-js";

export const kwil = new WebKwil({
    kwilProvider: "http://localhost:8090",
    chainId: "kwil-chain-FrsMSg82",
    logging: true,
    timeout: 10000
})