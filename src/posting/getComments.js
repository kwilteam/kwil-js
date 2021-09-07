import gateway from '../gateway.js';
import axios from 'axios';
import checkSignature from '../internal/checkSignature.js';

const getComments = async (_mainPost, _offset) => {
    let _url = gateway + `/${_mainPost}/${_offset}/comments`;
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

export default getComments;
//getComments('bb71d85ea037edaed1f54b8bfbb8ebec61d4511fb51f37104c02223ac2c587ca', 0)
