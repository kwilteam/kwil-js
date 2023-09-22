import { WebKwil } from "@lukelamey/kwil-js";

export const kwil = new WebKwil({
    kwilProvider: "http://localhost:8080",
      logging: true,
      timeout: 10000
})