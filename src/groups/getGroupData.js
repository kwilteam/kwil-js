import axios from 'axios';
import gateway from '../gateway.js';

const getGroupData = async (_groupName) => {
    _groupName = _groupName.toUpperCase();
    let _url = gateway + `/${_groupName}/groupData`;
    const params = {
        url: _url,
        method: 'get',
        timeout: 20000,
    };
    let response = await axios(params);
    response = response.data;
    response.group_name = _groupName;
    return response;
};
export default getGroupData;
