import axios from 'axios';
import { gateway } from '../gateway.js';

const ifUserExists = async (_username) => {
    //Check to see if this user exists.
    _username = _username.toLowerCase();
    const _url = gateway + '/' + _username + '/' + 'ifUserExists';
    const params = {
        url: _url,
        method: 'get',
        timeout: 20000,
    };
    const response = await axios(params);
    console.log(response.data)
    if (response.data == '') {
        return false;
    } else {
        return true;
    }
};

export default ifUserExists;
