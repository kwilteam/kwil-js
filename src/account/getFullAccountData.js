import axios from 'axios';
import gateway from '../gateway.js';

const getFullAccountData = async (_username) => {
    //Same as getAccountData, but returns the photoHash instead of the URL
    const _url = gateway + '/' + _username.toLowerCase() + '/accountData';
    const params = {
        url: _url,
        method: '',
        timeout: 20000,
    };
    let response = await axios(params);
    response = response.data;
    return {
        username: _username,
        name: response.display_name,
        bio: response.bio,
        photoHash: response.pfp_hash,
    };
};

export default getFullAccountData;
