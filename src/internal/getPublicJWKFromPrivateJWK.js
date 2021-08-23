import rs from 'jsrsasign'
const getPublicJWKFromPrivateJWK = (_privateJWK) => {
    //This function takes a private key and returns a public JWK
    let pubJWK = {
        kty: _privateJWK.kty,
        n: _privateJWK.n,
        e: _privateJWK.e
    }
    //let pubKey = rs.KEYUTIL.getKey(pubJWK)
    //let pubPem = rs.KEYUTIL.getPEM(pubKey)
    return pubJWK
}

export default getPublicJWKFromPrivateJWK
