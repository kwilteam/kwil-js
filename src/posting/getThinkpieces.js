import gateway from '../gateway.js';
import axios from 'axios';
import checkSignature from '../internal/checkSignature.js';

const getThinkpieces = async (_username, _offset) => {
    let _url = gateway + `/${_username.toUpperCase()}/${_offset}/thinkpieces`;
    const params = {
        url: _url,
        method: 'get',
        timeout: 20000,
        headers: { 'Content-Type': 'application/json' },
    };

    let response = await axios(params);
    for (let i = 0; i < response.data.length; i++) {
        if (!checkSignature(response.data[i].data, response.data[i].signature)) {
            throw 'Invalid Signature';
        }
    }
    return response.data;
};

export default getThinkpieces;
//getThinkpieces('brennanjl', 0)
