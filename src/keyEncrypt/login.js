import gateway from '../gateway.js';
import aes256 from 'aes256';
import axios from 'axios';
import checkSignature from '../internal/checkSignature.js';
import getFirstCharacter from '../internal/getFirstCharacter.js';

const login = async (_username, _password) => {
    let _url = gateway + '/' +_username.toLowerCase() + '/login';
    const params = {
        url: _url,
        method: 'get',
        timeout: 20000,
    };
    try {
        let response = await axios(params);
        const loginCipher = response.data[0]
        const encryptKey = _username.toLowerCase() + _password + loginCipher.salt;
        const decryptedKey = aes256.decrypt(encryptKey, loginCipher.login_ciphertext)
        let privateKey = ''
        try {
            privateKey = JSON.parse(decryptedKey)
        } catch (e) {
            return { privateKey: '', loginValid: false }
        }
        if (privateKey.e == 'AQAB') {
            return { privateKey: privateKey, loginValid: true }
        } else {
            console.log('Invalid private key format.  Decryption likely failed.')
            return { privateKey: '', loginValid: false }
        }
    } catch (e) {
        console.log(e);
        return { privateKey: '', loginValid: false };
    }
};
export default login;
