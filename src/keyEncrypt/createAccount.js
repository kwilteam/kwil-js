import axios from 'axios';
import gateway from '../gateway.js';
import aes256 from 'react-native-crypto-js';
import generateKeyPair from './generateKeyPair.js';
import generateSalt from '../internal/generateSalt.js';
import scrypt from 'scrypt-js'
import generateChatAESKey from '../internal/generateChatAESKey.js'
import sha384 from '../internal/sha384.js';
import sign from '../internal/sign.js';
import rs from 'jsrsasign'

const createAccount = async (_username, _password, salt = generateSalt(), _email = '') => {
    if (_email != '') {
        throw new Error('This library does not support the email parameter anymore.')
    }
    _username = _username.toLowerCase();
    //username must be 5-20 characters
    //password must be 1 upper case, 1 lower case, 1 number, 8 characters
    if (_username.length > 30) {
        throw new Error('Name to long');
    }
    const keys = await generateKeyPair()
    const passKey = _username+_password+salt
    const scryptHash = await scrypt.scrypt(Buffer.from(passKey.normalize('NFKC')), Buffer.from(salt.normalize('NFKC')), 8192, 8, 1, 32)
    let cipherText = aes256.AES.encrypt(JSON.stringify(keys.privateKey), scryptHash.toString())
        cipherText = cipherText.toString()
    const settingsScryptHash = await generateChatAESKey(keys.privateKey.p, keys.privateKey.q)
    let settingsCipherText = aes256.AES.encrypt(JSON.stringify({chats: []}), settingsScryptHash.toString())
        settingsCipherText = settingsCipherText.toString()
    let settingsHash = sha384(settingsCipherText)
    const currentDate = new Date
    const user = {
        username: _username,
        modulus: keys.privateKey.n,
        name: '',
        bio: '',
        pfpHash: '',
        bannerHash: '',
        timestamp: currentDate,
        settings: settingsHash,
        signature: sign(JSON.stringify({
            username: _username,
            modulus: keys.privateKey.n,
            name: '',
            bio: '',
            pfpHash: '',
            bannerHash: '',
            timestamp: currentDate,
            settings: settingsHash,
        }), rs.KEYUTIL.getKey(keys.privateKey)),
        salt: salt,
        login: cipherText,
        creationSignature: sign(JSON.stringify({
            username: _username,
            salt: salt,
            login: cipherText,
        }), rs.KEYUTIL.getKey(keys.privateKey))
    }
                const _url = gateway + '/createAccount';
                const params = {
                    url: _url,
                    method: 'post',
                    timeout: 20000,
                    headers: { 'Content-Type': 'application/json' },
                    data: user,
                };
                console.log(user)
                const response = await axios(params);
                console.log(response.data)
                return { privateKey: keys.privateKey, loginValid: true };
};
export default createAccount;