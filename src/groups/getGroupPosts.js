import { gateway } from '../gateway.js';
import axios from 'axios';

const getGroupPosts = async (_group, _date = new Date(), numPosts = 20) => {
    if (typeof _date == 'string') {
        _date = new Date(_date);
    }
    _date = _date.getTime();
    let _url = gateway + `/${_group.toUpperCase()}/${_date}/${numPosts}/getGroupPosts`;
    const params = {
        url: _url,
        method: 'get',
        timeout: 20000,
        headers: { 'Content-Type': 'application/json' },
    };

    let response = await axios(params);
    try {
        return {
            posts: response.data,
            lastDate: new Date(response.data[response.data.length - 1].post_time),
        };
    } catch (e) {
        return { posts: [], lastDate: '' };
    }
};

export default getGroupPosts;
