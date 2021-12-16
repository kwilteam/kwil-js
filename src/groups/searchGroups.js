import gateway from '../gateway.js'
import axios from 'axios'

const searchGroups = async (_group) => {
    _group = _group.toUpperCase()
    const _url = gateway + `/${_group}/searchGroups`
    const params = {
        url: _url,
        method: 'get',
        timeout: 20000,
    };
    const response = await axios(params)
    const userArr = []
    for (let i=0; i<response.data.length; i++) {
        userArr.push(response.data[i].group_name)
    }
    return userArr
}

export default searchGroups