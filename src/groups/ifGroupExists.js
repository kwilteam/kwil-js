import axios from 'axios';
import gateway from '../gateway.js';
const ifGroupExists = async (_group) => {
    const _url = gateway + '/' + _group.toUpperCase() + '/ifGroupExists';
    const params = {
        url: _url,
        method: 'get',
        timeout: 20000,
    };
    const response = await axios(params);
    if (response.data.length > 0) {
        return true;
    } else {
        return false;
    }
};
export default ifGroupExists;
