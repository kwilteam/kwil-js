import axios from 'axios';
import { gateway } from '../gateway.js';

const getFollowers = async (_username) => {
    _username = _username.toLowerCase()
    let _url = gateway + `/${_username}/followers`;
    const params = {
        url: _url,
        method: 'get',
        timeout: 20000,
    };
    const res = await axios(params);
    const followers = []
    res.data.forEach(_follower => {
        followers.push(_follower.follower)
    })
    return followers
}

export default getFollowers