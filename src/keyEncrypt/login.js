import { gateway } from '../gateway.js';
import aes256 from 'react-native-crypto-js';
import axios from 'axios';
import scrypt from 'scrypt-js'

const login = async (_username, _password) => {
    const _url = gateway + '/' + _username.toLowerCase() + '/login';
    const params = {
        url: _url,
        method: 'get',
        timeout: 20000,
    };
    try {
        let response = await axios(params);
        const loginCipher = response.data[0];
        const encryptKey = _username.toLowerCase() + _password + loginCipher.salt;
        const scryptHash = await scrypt.scrypt(Buffer.from(encryptKey.normalize('NFKC')), Buffer.from(loginCipher.salt.normalize('NFKC')), 8192, 8, 1, 32)
        let decryptedKey = aes256.AES.decrypt(loginCipher.login_ciphertext, scryptHash.toString());
        decryptedKey = decryptedKey.toString(aes256.enc.Utf8)
        let privateKey = '';
        try {
            privateKey = JSON.parse(decryptedKey);
        } catch (e) {
            return { privateKey: '', loginValid: false };
        }
        if (privateKey.e == 'AQAB') {
            return { privateKey: privateKey, loginValid: true };
        } else {
            console.log('Invalid private key format.  Decryption likely failed.');
            return { privateKey: '', loginValid: false };
        }
    } catch (e) {
        console.log(e);
        return { privateKey: '', loginValid: false };
    }
};
export default login;
