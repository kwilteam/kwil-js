import gateway from '../gateway.js';
import axios from 'axios';

const getFeed = async (_username, _date= new Date, _limit=20) => {
    if (typeof _date == 'string') {
        _date = new Date(_date)
        }
    _date = _date.getTime()
    const _url = gateway + `/${_username.toLowerCase()}/${_date}/${_limit}/getFeed`;
    const params = {
        url: _url,
        method: 'get',
        timeout: 20000,
        headers: { 'Content-Type': 'application/json' },
    };

    const response = await axios(params);
    return response.data;
};

export default getFeed;
//getFeed('brennanjl', 0)
