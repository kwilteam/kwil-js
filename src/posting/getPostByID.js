import gateway from '../gateway.js';
import axios from 'axios';
import getFirstCharacter from '../internal/getFirstCharacter.js';
import checkSignature from '../internal/checkSignature.js';

const getPostByID = async (_ID, _username, _type) => {
    let firstChar = getFirstCharacter(_username);
    let type = '';
    if (_type.toLowerCase() == 'thought') {
        type = 'thoughts';
    } else if (_type.toLowerCase() == 'thinkpiece') {
        type = 'thinkpieces';
    } else {
        throw new Error('type must be thought or thinkpiece');
    }
    let _url =
        gateway +
        '/accounts/' +
        firstChar +
        '/' +
        _username.toUpperCase() +
        `/posts/${type}/${_ID}/info`;
    const params = {
        url: _url,
        method: 'get',
        timeout: 20000,
    };
    let response = await axios(params);

    if (checkSignature(response.data.data, response.data.signature)) {
        return response.data;
    }
};

export default getPostByID;
