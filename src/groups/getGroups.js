import gateway from '../gateway.js';
import axios from 'axios';

const getGroups = async (_username) => {
    _username = _username.toLowerCase();
    let _url = gateway + '/' + _username + '/getGroups';
    const params = {
        url: _url,
        method: 'get',
        timeout: 20000,
    };
    let response = await axios(params);
    const groupList = [];
    for (let i = 0; i < response.data.length; i++) {
        groupList.push(response.data[i].group_name);
    }
    return groupList;
};

export default getGroups;
