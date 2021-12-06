import axios from 'axios';
import sign from '../internal/sign.js';
import rs from 'jsrsasign';
import gateway from '../gateway.js';

const unlike = async (_postID, _username, _privateJWK) => {
    const _privateKey = rs.KEYUTIL.getKey(_privateJWK);
    const likeData = { postID: _postID, username: _username, timestamp: new Date};
    const dataSignature = sign(JSON.stringify(likeData), _privateKey);
    const _url = gateway + `/unlike`;
    const params = {
        url: _url,
        method: 'post',
        timeout: 20000,
        headers: { 'Content-Type': 'application/json' },
        data: { data: likeData, signature: dataSignature },
    };
    console.log(await axios(params));
};
export default unlike;