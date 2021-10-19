import rs from 'jsrsasign';
import axios from 'axios';
import gateway from '../gateway.js';
import sign from '../internal/sign.js';
import isFollowing from './isFollowing.js'

const follow = async (username, usernameToFollow, _privateJWK) => {
    const _username = username.toLowerCase()
    const _usernameToFollow = usernameToFollow.toLowerCase()
    const _privateKey = rs.KEYUTIL.getKey(_privateJWK);
    const userIsFollowing = await isFollowing(_username, _usernameToFollow)
    if (!userIsFollowing) {
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
        await axios(params);
        return
    } else {
        console.log('User already follower this user')
        return
    }
};

export default follow;