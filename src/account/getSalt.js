import axios from 'axios'
import gateway from '../gateway.js'

const getSalt = async(_username) => {
    _username = _username.toLowerCase()
    const _url = gateway + `/${_username}/salt`
    const params = {
        url: _url,
        method: 'get',
        timeout: 20000,
    };
    const response = await axios(params);
    return response.data.salt
}

export default getSalt