import axios from "axios";
import gateway from "../gateway.js"

const getGroupFollowers = async (_group) => {
    _group = _group.toUpperCase()
    const _url = gateway + `/${_group}/getGroupFollowers`
    const params = {
        url: _url,
        method: 'get',
        timeout: 20000,
    };
    const response = await axios(params)
    const retArr = []
    for (let i = 0; i<response.data.length; i++) {
        retArr.push(response.data[i].follower)
    }
    return retArr
}

export default getGroupFollowers