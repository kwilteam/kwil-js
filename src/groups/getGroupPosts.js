import gateway from '../gateway.js'
import axios from 'axios'
import checkSignature from '../internal/checkSignature.js'

const getGroupPosts = async (_group, _offset, numPosts = 20) => {
    let _url = gateway + `//${_offset}/${_group}/${numPosts}/posts`
    const params = {
                url: _url,
                method: 'get',
                timeout: 20000,
                headers: {"Content-Type": "application/json"}
                  }
            
    let response = await axios(params)
    for (let i=0; i<response.data.length; i++) {
        if (!checkSignature(response.data[i].data, response.data[i].signature)){
            throw 'Invalid Signature'
        }
}
return response.data
}

export default getGroupPosts