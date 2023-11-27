import { KwilSigner, WebKwil } from "../../../src/"

export async function kwilAuthenticate(kwil: WebKwil, signer: KwilSigner): Promise<void> {
    const res = await kwil.authenticate(signer);
    console.log(res)
}