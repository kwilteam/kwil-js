import { WebKwil } from "../../../src";

export const kwil = new WebKwil({
    kwilProvider: "https://localhost:8090",
    chainId: "kwil-chain-zQQTmt8D",
    logging: true,
    timeout: 10000
})