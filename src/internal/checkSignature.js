import rs from 'jsrsasign';
import getPublicJWKFromPrivateKey from './getPublicJWKFromPrivateKey.js'

const checkSignature = (_post, _privateKey) => {
    var sig2 = new rs.crypto.Signature({ alg: 'SHA256withRSA' });
    const pubJWK = getPublicJWKFromPrivateKey(_privateKey)
    const pubKey = rs.KEYUTIL.getKey(pubJWK)
    sig2.init(pubKey);
    sig2.updateString(JSON.stringify(_post.data));
    return sig2.verify(_post.signature);
};

export default checkSignature;
