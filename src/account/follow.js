import rs from 'jsrsasign';
import axios from 'axios';
import gateway from '../gateway.js';
import sign from '../internal/sign.js';

const follow = async (_username, _usernameToFollow, _privateJWK) => {
    //Function used to follow any other individual.  Is worth noting that if you call this for a nonexistant followee, and that account becomes created, you will then follow them.
    _username = _username.toLowerCase()
    _usernameToFollow = _usernameToFollow.toLowerCase();
    const _privateKey = rs.KEYUTIL.getKey(_privateJWK);
    const followingReceipt = {
        username: _username,
        followee: _usernameToFollow,
        follow: true,
        timeStamp: new Date(),
    };
    const dataSignature = sign(JSON.stringify(followingReceipt), _privateKey);
    let _url = gateway + '/follow';
    const params = {
        url: _url,
        method: 'post',
        timeout: 20000,
        data: { data: followingReceipt, signature: dataSignature },
    };
    const res = await axios(params);
    return res.data;
};

export default follow;
