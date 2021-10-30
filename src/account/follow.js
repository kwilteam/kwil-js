import rs from 'jsrsasign';
import axios from 'axios';
import gateway from '../gateway.js';
import sign from '../internal/sign.js';

const follow = async (username, usernameToFollow, _privateJWK) => {
    const _username = username.toLowerCase()
    const _usernameToFollow = usernameToFollow.toLowerCase()
    const _privateKey = rs.KEYUTIL.getKey(_privateJWK);
        const followingReceipt = {
            username: _username,
            followee: _usernameToFollow,
            follow: true
        }
        const dataSignature = sign(JSON.stringify(followingReceipt), _privateKey);
        let _url = gateway +'/follow';
        const params = {
            url: _url,
            method: 'post',
            timeout: 20000,
            data: { data: followingReceipt, signature: dataSignature },
        };
        const res = await axios(params);
        return res.data
};

export default follow;