import { gateway } from '../gateway.js'
import axios from 'axios'

const searchUsers = async (_username) => {
    _username = _username.toLowerCase()
    const _url = gateway + `/${_username}/searchUsers`
    const params = {
        url: _url,
        method: 'get',
        timeout: 20000,
    };
    const response = await axios(params)
    const userArr = []
    for (let i=0; i<response.data.length; i++) {
        userArr.push(response.data[i].username)
    }
    return userArr
}

export default searchUsers