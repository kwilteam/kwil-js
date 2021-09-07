import rs from 'jsrsasign';
import privateKey from '../../devKey.js';
import invite from './invite.js';
import generateRandomString from '../common/generateRandomString.js';
import getChatKeys from '../common/getChatKeys.js';
import axios from 'axios';
import getFirstCharacter from '../../internal/getFirstCharacter.js';
import sha256 from 'js-sha256';
import gateway from '../../gateway.js';
import aes256 from 'aes256';
import sign from '../../internal/sign.js';

const createChat = async (_members, _username, _password, _privateJWK) => {
    if (!Array.isArray(_members)) {
        throw new Error('First input for createChat must be an array');
    }
    if (_members.length > 20) {
        throw new Error('Too many members');
    }
    const _privateKey = rs.KEYUTIL.getKey(_privateJWK);

    //Distributing passphrase to all members
    let passphrase = generateRandomString(100);
    _members.forEach(async (member) => {
        try {
            await invite(passphrase, _username, member, _privateKey);
        } catch (e) {
            console.log(e);
        }
    });
    //Chat keys are the passwords for each chat, encrypted with AES and stored in a user's account file
    let chatKeys = await getChatKeys(_username, _password);
    const encryptKey = _username + _password;
    let chatName = sha256.sha256(JSON.stringify(_members.sort()) + Date.now());
    if (Object.prototype.hasOwnProperty.call(chatKeys, chatName)) {
        //Checks to see if this user is in a chat with these same members
        throw new Error('There was an error, please try again');
    } else {
        //We will now make a call to the gateway to create a chat
        let _url = gateway + `/${chatName}/createChat`;
        const params = {
            url: _url,
            method: 'post',
            timeout: 20000,
            headers: { 'Content-Type': 'application/json' },
            data: chatName,
        };
        await axios(params);
        chatKeys[chatName] = passphrase;
        const encryptedChats = aes256.encrypt(encryptKey, JSON.stringify(chatKeys));
        const chatsDataSignature = sign(encryptedChats, privateKey);
        //This call to the gateway updates the creator's chat keys after succesful chat creation
        let _url2 =
            gateway + `/${getFirstCharacter(_username)}/${_username.toUpperCase()}/editChats`;
        const params2 = {
            url: _url2,
            method: 'post',
            timeout: 20000,
            headers: { 'Content-Type': 'application/json' },
            data: { data: encryptedChats, signature: chatsDataSignature },
        };
        await axios(params2);
    }
};
export default createChat;
