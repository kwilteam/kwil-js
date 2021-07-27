import rs from 'jsrsasign'
const getPublicJWKFromPrivateKey = (_privateKey) => {
    //This function takes a private key and returns a public JWK
    let privJWK = rs.KEYUTIL.getJWKFromKey(_privateKey)
    let pubJWK = {
        kty: privJWK.kty,
        n: privJWK.n,
        e: privJWK.e
    }
    //let pubKey = rs.KEYUTIL.getKey(pubJWK)
    //let pubPem = rs.KEYUTIL.getPEM(pubKey)
    return pubJWK
}

export default getPublicJWKFromPrivateKey

/*let pKey = rs.KEYUTIL.generateKeypair('RSA', 512)
console.log(getPublicJWKFromPrivateKey(pKey.prvKeyObj))*/