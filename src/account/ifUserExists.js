import axios from 'axios'
import gateway from '../gateway.js'

const ifUserExists = async (_usernameReg) => {
    const _username = _usernameReg.toLowerCase();
    const _url = gateway +'/' + _username + '/' + 'ifUserExists'
    const params = {
        url: _url,
        method: 'get',
        timeout: 20000,
    };
    const response = await axios(params)
    if (response.data == '') {
        return false
    } else {
        return true
    }
};

export default ifUserExists;
