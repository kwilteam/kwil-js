import axios from 'axios'
import gateway from '../gateway.js'

const isFollowingGroup = async (_username, _group) => {
    const _url = gateway + `/`+_username.toLowerCase()+'/'+_group.toUpperCase()+'/isFollowingGroup';
    const params = {
        url: _url,
        method: 'get',
        timeout: 20000,
    };
    const response = await axios(params);
    if (response.data == '') {
        return false
    } else {
        return true
    }
};
export default isFollowingGroup;
