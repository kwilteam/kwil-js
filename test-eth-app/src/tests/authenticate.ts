import { KwilSigner, WebKwil } from "@lukelamey/kwil-js"

export async function kwilAuthenticate(kwil: WebKwil, signer: KwilSigner): Promise<void> {
    await kwil.authenticate(signer);
}