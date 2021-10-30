import gateway from '../gateway.js';
import axios from 'axios';
import checkSignature from '../internal/checkSignature.js';

const getGroupPosts = async (_group, _offset, numPosts = 20) => {
    let _url = gateway + `/${_group.toUpperCase()}/getGroupPosts`;
    const params = {
        url: _url,
        method: 'get',
        timeout: 20000,
        headers: { 'Content-Type': 'application/json' },
    };

    let response = await axios(params);
    return response.data;
};

export default getGroupPosts;