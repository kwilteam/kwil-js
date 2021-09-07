import rs from 'jsrsasign';
import axios from 'axios';
import gateway from '../gateway.js';
import sign from '../internal/sign.js';
import getFirstCharacter from '../internal/getFirstCharacter.js';
import getFollowingData from '../internal/getFollowingData.js';

const unfollow = async (_username, _usernameToUnfollow, _privateJWK) => {
    const _privateKey = rs.KEYUTIL.getKey(_privateJWK);
    let firstChar = getFirstCharacter(_username);
    let followingData = await getFollowingData(_username);
    let followingList = followingData.following;
    if (!followingList.includes(_usernameToUnfollow)) {
        console.log('User does not follow');
    } else {
        const index = followingList.indexOf(_usernameToUnfollow);
        if (index > -1) {
            followingList.splice(index, 1);
        }
        followingData.following = followingList;
        //Generate data signature
        const dataSignature = sign(JSON.stringify(followingData), _privateKey);

        let _url = gateway + '/' + firstChar + '/' + _username.toUpperCase() + '/following';
        const params = {
            url: _url,
            method: 'post',
            timeout: 20000,
            data: { data: followingData, signature: dataSignature },
        };
        await axios(params);
    }
};

export default unfollow;
