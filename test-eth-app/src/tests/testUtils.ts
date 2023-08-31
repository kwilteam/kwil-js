import { WebKwil } from "luke-dev";

export const kwil = new WebKwil({
    kwilProvider: "https:provider.kwil.com",
      logging: true,
      timeout: 10000
})