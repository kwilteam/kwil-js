import axios from 'axios';
import gateway from '../gateway.js';

const getMembers = async (_groupName) => {
    const _url = gateway + '/' + _groupName.toUpperCase() + '/getModerators';
    const params = {
        url: _url,
        method: 'get',
        timeout: 20000,
    };
    const response = await axios(params);
    return response.data;
};

export default getMembers;
