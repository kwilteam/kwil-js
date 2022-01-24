import rs from 'jsrsasign';
import axios from 'axios';
import { gateway } from '../gateway.js';
import sign from '../internal/sign.js';

const unfollowGroup = async (_group, _username, _privateJWK) => {
    _username = _username.toLowerCase();
    _group = _group.toUpperCase();
    const _privateKey = rs.KEYUTIL.getKey(_privateJWK);
    const followReceipt = {
        username: _username,
        group: _group,
        follow: false,
        timestamp: Date.now()
    };
    const dataSignature = sign(JSON.stringify(followReceipt), _privateKey);
    let _url = gateway + '/followGroup';
    const params = {
        url: _url,
        method: 'post',
        timeout: 20000,
        data: { data: followReceipt, signature: dataSignature },
    };
    const response = await axios(params);
    return response.data;
};

export default unfollowGroup;
