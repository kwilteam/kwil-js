import axios from 'axios';
import gateway from '../gateway.js';
import aes256 from 'react-native-crypto-js';
import { NewUser } from '../classes.js';
import generateKeyPair from './generateKeyPair.js';
import generateSalt from '../internal/generateSalt.js';
import scrypt from 'scrypt-js'

const createAccount = async (_username, _password, salt = generateSalt(), _email = '') => {
    _username = _username.toLowerCase();
    //username must be 5-20 characters
    //password must be 1 upper case, 1 lower case, 1 number, 8 characters
    if (_username.length > 30) {
        throw new Error('Name to long');
    }
    const keys = await generateKeyPair()
    const passKey = _username+_password+salt
    const scryptHash = await scrypt.scrypt(Buffer.from(passKey.normalize('NFKC')), Buffer.from(salt.normalize('NFKC')), 8192, 8, 1, 32)
    const cipherText = aes256.AES.encrypt(JSON.stringify(keys.privateKey), scryptHash.toString())
    const settingsCipherText = aes256.AES.encrypt(JSON.stringify({chats: []}), scryptHash.toString())
    const user = new NewUser(_username, cipherText.toString(), keys.privateKey, salt, settingsCipherText.toString());
                const _url = gateway + '/createAccount';
                const params = {
                    url: _url,
                    method: 'post',
                    timeout: 20000,
                    headers: { 'Content-Type': 'application/json' },
                    data: user,
                };
                await axios(params);
                console.log('Using 3.1.8')
                return { privateKey: keys.privateKey, loginValid: true };
};
export default createAccount;