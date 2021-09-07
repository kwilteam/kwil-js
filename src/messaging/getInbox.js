import axios from 'axios';
import gateway from '../gateway.js';
import getFirstCharacter from '../internal/getFirstCharacter.js';

const getInbox = async (_username) => {
    let firstChar = getFirstCharacter(_username);
    let _url = gateway + `/${_username.toUpperCase()}/${firstChar}/getInbox`;
    const params = {
        url: _url,
        method: 'get',
        timeout: 20000,
    };
    let response = await axios(params);
    return response.data;
};

export default getInbox;
