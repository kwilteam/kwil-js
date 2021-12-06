import rs from 'jsrsasign';
import getPublicJWKFromPrivateJWK from '../internal/getPublicJWKFromPrivateJWK.js';

const generateKeyPair = async () => {
    async function WrapperFunction() {
        if (typeof window === 'object') {
            if (typeof window.crypto === 'object') {
                try {
                    let keyPair = await window.crypto.subtle.generateKey(
                        {
                            name: 'RSA-PSS',
                            modulusLength: 4096, //can be 1024, 2048, or 4096
                            publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
                            hash: { name: 'SHA-256' }, //can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
                        },
                        true, //whether the key is extractable (i.e. can be used in exportKey)
                        ['sign', 'verify'] //can be any combination of "sign" and "verify"
                    );
                    let jwk = await window.crypto.subtle.exportKey('jwk', keyPair.privateKey);
                    let privateKey = rs.KEYUTIL.getKey(jwk);
                    const rsaJWK = rs.KEYUTIL.getJWKFromKey(privateKey);
                    return { pubKey: getPublicJWKFromPrivateJWK(rsaJWK), privateKey: rsaJWK };

                }
                catch ({ message } ) {
                    return {
                        status: 400,
                        message
                    };
                }
                //return keyPair;
            }
        } else {
            console.log('window.crypto not available.  Key generation may take a while...');
            try {
                let keyPair = await rs.KEYUTIL.generateKeypair('RSA', 4096);
                const rsaJWK = await rs.KEYUTIL.getJWKFromKey(keyPair.prvKeyObj);
                //let newUser = new User(_username, publicKey, encryptKey, dataSignature, accountDataSignature, pfpSignature, followDataSignature)
                return { pubKey: getPublicJWKFromPrivateJWK(rsaJWK), privateKey: rsaJWK };
            } catch (e) {
                console.log(e);
            }
        }
    }
    const retVal = await WrapperFunction()
    return retVal
}

export default generateKeyPair