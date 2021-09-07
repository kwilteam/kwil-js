import getFollowingData from '../internal/getFollowingData.js';
import getFirstCharacter from '../internal/getFirstCharacter.js';
import rs from 'jsrsasign';
import axios from 'axios';
import gateway from '../gateway.js';
import sign from '../internal/sign.js';

const followGroup = async (_group, _username, _privateJWK) => {
    let followingData = await getFollowingData(_username);
    let groups = followingData.groups;
    const _privateKey = rs.KEYUTIL.getKey(_privateJWK);
    let firstChar = getFirstCharacter(_username);
    if (groups.includes(_group.toUpperCase())) {
        console.log('User already follows');
    } else {
        groups.push(_group.toUpperCase());
        followingData.groups = groups;
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
    return followingData.groups;
};

export default followGroup;
