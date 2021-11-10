import axios from 'axios';
import gateway from '../gateway.js';
const getGroupPreview = async (_group) => {
    _group = _group.toUpperCase();
    const url = gateway + '/' + _group + '/groupPreview';
    const params = {
        url: url,
        method: 'get',
        timeout: 20000,
    };
    const response = await axios(params);
    return response.data

};
export default getGroupPreview;
