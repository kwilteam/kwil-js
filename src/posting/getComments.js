import gateway from '../gateway.js';
import axios from 'axios';

const getComments = async (_postID, _postType, _date = new Date(), _limit = 20) => {
    //_postType should be thought, thinkpiece, or comment
    if (typeof _date == 'string') {
        _date = new Date(_date);
    }
    if (_postType != 'thought' || _postType != 'thinkpiece' || _postType != 'comment') {
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
    return response.data;
};

export default getComments;