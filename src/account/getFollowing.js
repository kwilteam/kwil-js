import { gateway } from '../gateway.js';
import axios from 'axios';

const getFollowing = async (_username) => {
    _username = _username.toLowerCase()
    const _url = gateway + `/${_username}/following`
    const params = {
        url: _url,
        method: 'get',
        timeout: 20000,
    };
    let response = await axios(params);
    const following = []
    for (let i = 0; i<response.data.length; i++) {
        following.push(response.data[i].followee)
    }
    return following
};

export default getFollowing;
