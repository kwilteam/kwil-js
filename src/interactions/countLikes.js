import axios from 'axios'
import { gateway } from '../gateway.js'

const countLikes = async(_post) => {

    const _url = gateway + `/${_post}/countLikes`
    const params = {
        url: _url,
        method: 'get',
        timeout: 20000,
        headers: { 'Content-Type': 'application/json' }
    };
    const response = await axios(params)
    return response.data
}

export default countLikes