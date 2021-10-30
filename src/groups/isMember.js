import axios from 'axios'
import gateway from '../gateway.js'
const isMember = async (_username, _groupName) => {
    _username = _username.toLowerCase()
    _groupName = _groupName.toUpperCase()
    const url = gateway + '/'+_username+'/'+_groupName+'/isMember'
    const params = {
        url: url,
        method: 'get',
        timeout: 20000
    }
    const response = await axios(params)
    if (response.data.length > 0) {
        return true
    } else {
        return false
    }

};
export default isMember;
