import { KwilSigner, WebKwil } from "@lukelamey/kwil-js"

export async function kwilAuthenticate(kwil: WebKwil, signer: KwilSigner): Promise<void> {
    const res = await kwil.auth.authenticate(signer);
    console.log(res)
}

export async function kwilLogout(kwil: WebKwil): Promise<void> {
    const res = await kwil.auth.logout();
    console.log(res)  
}