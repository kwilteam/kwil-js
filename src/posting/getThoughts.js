import gateway from '../gateway.js';
import axios from 'axios';

const getThoughts = async (_username, _date= new Date, _limit=20) => {
    if (typeof _date == 'string') {
        _date = new Date(_date)
        }
    _date = _date.getTime()
    const _url = gateway + `/${_username.toLowerCase()}/${_date}/${_limit}/getThoughts`;
    const params = {
        url: _url,
        method: 'get',
        timeout: 20000,
        headers: { 'Content-Type': 'application/json' },
    };

    let response = await axios(params);
    return response.data;
};

export default getThoughts;
//getThoughts('brennanjl', 0)
