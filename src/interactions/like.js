import axios from 'axios';
import sign from '../internal/sign.js';
import rs from 'jsrsasign';
import gateway from '../gateway.js';

const like = async (_like, _postID, _username, _privateJWK) => {
    //like should be true if a like, false if a dislike
    const _privateKey = rs.KEYUTIL.getKey(_privateJWK);
    const likeData = { liked: _like, postID: _postID, username: _username , timestamp: Date.now()};
    const dataSignature = sign(JSON.stringify(likeData), _privateKey);
    const _url = gateway + `/like`;
    const params = {
        url: _url,
        method: 'post',
        timeout: 20000,
        headers: { 'Content-Type': 'application/json' },
        data: { data: likeData, signature: dataSignature },
    };
    console.log(await axios(params));
};
export default like;
