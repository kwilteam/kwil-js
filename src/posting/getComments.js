import gateway from '../gateway.js'
import axios from 'axios'
import checkSignature from '../internal/checkSignature.js'

const getComments = async (_mainPost, _offset) => {
let _url = gateway + `/${_mainPost}/${_offset}/comments`
const params = {
                url: _url,
                method: 'get',
                timeout: 20000,
                headers: {"Content-Type": "application/json"}
                  }
            
let response = await axios(params)
console.log(response.data)
for (let i=0; i<response.data.length; i++) {
    if (!checkSignature(response.data[i].data, response.data[i].signature)){
        throw 'Invalid Signature'
    }
}
return response.data
}

export default getComments
//getComments('3bf43ff441313b1fda118bceb4184bc9fc991a8ce5061553c750ae68ad3d91eb', 0)