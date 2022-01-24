import { gateway } from '../gateway.js';
import axios from 'axios';

const getComments = async (_postID, _postType, _date = new Date(), _limit = 20) => {
    //_postType should be post or comment
    if (typeof _date == 'string') {
        _date = new Date(_date);
    }
    if (_postType != 'post' && _postType != 'comment') {
        throw new Error('_postType must be thought, thinkpiece, or comment')
    }
    _date = _date.getTime();
    const _url = gateway + `/${_postID}/${_date}/${_limit}/${_postType.toLowerCase()}_comments/getComments`;
    const params = {
        url: _url,
        method: 'get',
        timeout: 20000,
        headers: { 'Content-Type': 'application/json' },
    };

    const response = await axios(params);
    try {
        const newDate = new Date(response.data[response.data.length - 1].post_time)
        return {
            posts: response.data,
            lastDate: newDate.toString(),
        };
    } catch (e) {
        return { posts: [], lastDate: '' };
    }
};

export default getComments;