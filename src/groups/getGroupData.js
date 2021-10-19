import axios from 'axios';
import gateway from '../gateway.js';
import getFirstCharacter from '../internal/getFirstCharacter.js';
import checkSignator from '../internal/checkSignator.js';

const getGroupData = async (_groupName) => {
    _groupName= _groupName.toUpperCase()
    let _url = gateway + `/${_groupName}/accountData`;
    const params = {
        url: _url,
        method: 'get',
        timeout: 20000,
    };
    let response = await axios(params);
    response = response.data
    response.group_name = _groupName
};
export default getGroupData;
