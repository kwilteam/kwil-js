import { KwilSigner, WebKwil } from "../../../src"

export async function kwilAuthenticate(kwil: WebKwil, signer: KwilSigner): Promise<void> {
    const res = await kwil.auth.authenticateKGW(signer);
    console.log(res)
}

export async function kwilLogout(kwil: WebKwil): Promise<void> {
    const res = await kwil.auth.logoutKGW();
    console.log(res)  
}