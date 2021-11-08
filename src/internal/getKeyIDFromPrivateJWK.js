import rs from 'jsrsasign';
import getPublicJWKFromPrivateJWK from './getPublicJWKFromPrivateJWK.js';

const getKeyIDFromPrivateJWK = (_privateKey) => {
    const pubJWK = getPublicJWKFromPrivateJWK(_privateKey);
    const pubKey = rs.KEYUTIL.getKey(pubJWK);
    return rs.KEYUTIL.getKeyID(pubKey);
};
export default getKeyIDFromPrivateJWK;
