import getPublicJWKFromPrivateKey from '../internal/getPublicJWKFromPrivateKey.js';
import sha256 from 'js-sha256';
import sign from '../internal/sign.js';
import gateway from '../gateway.js';
import rs from 'jsrsasign';
import getFirstCharacter from '../internal/getFirstCharacter.js';
import axios from 'axios';

const createThought = async (_postText, _img, _privateJWK, _username, _groupTag = '') => {
    const _privateKey = rs.KEYUTIL.getKey(_privateJWK);
    let randTime = Date.now();
    let _data = {
        postText: _postText,
        postPhoto: _img,
        publicKey: getPublicJWKFromPrivateKey(_privateKey),
        type: 'Thought',
        timeStamp: randTime,
        username: _username,
        groupTag: _groupTag,
    };
    let _signature = sign(JSON.stringify(_data), _privateKey);
    let _ID = sha256.sha256(_signature + randTime.toString());
    let postData = {
        data: _data,
        signature: _signature,
        ID: _ID,
        username: _username,
    };
    const _url = gateway + `/${getFirstCharacter(_username)}/${_username.toUpperCase()}/thought`;
    const params = {
        url: _url,
        method: 'post',
        timeout: 20000,
        headers: { 'Content-Type': 'application/json' },
        data: postData,
    };
    await axios(params);

    return _data;
};
export default createThought;
