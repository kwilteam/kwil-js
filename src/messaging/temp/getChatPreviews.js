import axios from 'axios';
import gateway from '../../gateway.js';

const getChatPreviews = async (_username) => {
    const _url = gateway + '/' + _username.toLowerCase() + `/getChatPreviews`;
    const params = {
        url: _url,
        method: 'get',
        timeout: 20000,
        headers: { 'Content-Type': 'application/json' },
    };
    return await axios(params);
};

export default getChatPreviews;
