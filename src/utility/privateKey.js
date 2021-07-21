import NodeRSA from 'node-rsa'

const importKeys = (_privateKey) => {
    //Input _privateKey is a stringified buffer
    let falseKey = new NodeRSA()
    let key = falseKey.importKey(_privateKey, 'pkcs1-private-pem')
    let untrimmedPublicKey = key.exportKey('pkcs8-public-pem')
    let untrimmedPublicKey2 = untrimmedPublicKey.replace('-----BEGIN PUBLIC KEY-----\n', '')
    let publicKey = untrimmedPublicKey2.replace('\n-----END PUBLIC KEY-----', '')
    return {"publicKey": publicKey,
            "privateKey": _privateKey}
}

module.exports = {importKeys}