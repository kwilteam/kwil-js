import { gateway } from '../gateway.js';
import axios from 'axios';
import getFirstCharacter from '../internal/getFirstCharacter.js';
import checkSignature from '../internal/checkSignature.js';

const getFollowingData = async (_username) => {
    let firstChar = getFirstCharacter(_username);
    const _url = gateway + '/accounts/' + firstChar + '/' + _username.toUpperCase() + '/following';
    const params = {
        url: _url,
        method: 'get',
        timeout: 20000,
    };
    let response = await axios(params);

    if (checkSignature(response.data.data, response.data.signature)) {
        return response.data.data;
    }
};

export default getFollowingData;
