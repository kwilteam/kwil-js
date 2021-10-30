import gateway from '../gateway.js';
import axios from 'axios';

const getComments = async (_postID, _postType, _date= new Date, _limit=20) => {
    //_postType should be thought, thinkpiece, or comment
    if (typeof _date == 'string') {
        _date = new Date(_date)
        }
    _date = _date.getTime()
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
//getComments('bb71d85ea037edaed1f54b8bfbb8ebec61d4511fb51f37104c02223ac2c587ca', 0)
