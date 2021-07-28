import axios from 'axios'
import gateway from '../gateway.js'
import checkSignature from '../internal/checkSignature.js'
import getFirstCharacter from '../internal/getFirstCharacter.js'

const getAccountData = async (_username) => {
    let firstChar = getFirstCharacter(_username)
    let _url = gateway + `/accounts/${firstChar}/${_username.toUpperCase()}/data`
    const params = {
        url: _url,
        method: 'get',
        timeout: 20000
      }
    let response = await axios(params)
    return response.data.data
}

export default getAccountData
/*const testFunc = async () => {
console.log(await getAccountData('Brennanjl2'))
}
testFunc()*/