import axios from 'axios';
import gateway from './gateway.js';
import rs from 'jsrsasign';
import { NewUser } from './classes.js';
import getPublicJWKFromPrivateJWK from './internal/getPublicJWKFromPrivateJWK.js';

const createAccountTest = async (_usernameReg, _password, _email = '') => {
    const _username = _usernameReg.toLowerCase();
    //username must be 5-20 characters
    //password must be 1 upper case, 1 lower case, 1 number, 8 characters
    if (_username.length > 30) {
        throw new Error('Name to long');
    }

    //Check for window.crypto.subtle
    let keyArr = [];
    if (typeof window === 'object') {
        if (typeof window.crypto === 'object') {
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
            console.log(jwk);
            let privateKey = rs.KEYUTIL.getKey(jwk);
            keyArr.push(privateKey);
        }
    } else {
        console.log('window.crypto not available.  Key generation may take a while...');
        let keyPair = rs.KEYUTIL.generateKeypair('RSA', 4096);
        keyArr.push(keyPair.prvKeyObj);
    }

    //JSRSASIGN section
    const privateKey = keyArr[0];
    const rsaJWK = rs.KEYUTIL.getJWKFromKey(privateKey);
    const user = new NewUser(_username, _password, rsaJWK, _email);
    console.log(user);

    const _url = gateway + '/createAccount';
    const params = {
        url: _url,
        method: 'post',
        timeout: 20000,
        headers: { 'Content-Type': 'application/json' },
        data: user,
    };
    const response = await axios(params);
    console.log(response.data);
    //let newUser = new User(_username, publicKey, encryptKey, dataSignature, accountDataSignature, pfpSignature, followDataSignature)
    return { pubKey: getPublicJWKFromPrivateJWK(rsaJWK), privateKey: rsaJWK };
};
export default createAccountTest;
