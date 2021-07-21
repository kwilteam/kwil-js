import NodeRSA from 'node-rsa'
import gateway from '../gateway.js'
import aes256 from 'aes256'
import axios from 'axios'
import buffer from 'buffer'
import checkSignature from '../internal/checkSignature.js'

const login = async (_username, _password) => {
    const getFirstCharacter = (_username) => {
        let validStarters = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z","1","2","3","4","5","6","7","8","9"]
        if (validStarters.includes(_username[0].toUpperCase())){
            return _username[0].toUpperCase()
        }
        else {
            return 'OTHER'
        }
    }
    let firstChar = getFirstCharacter(_username)
    const key = await new NodeRSA();
    let _url = gateway + '/accounts/' + firstChar + '/' + _username
    const params = {
        url: _url,
        method: 'get',
        timeout: 20000
      }
      let response = await axios(params)
      if (checkSignature(response.data)){
      let loginCipher = response.data.data.login
      const encryptKey = _username + _password
      let finalLog = aes256.decrypt(encryptKey, buffer.Buffer.from(loginCipher))
      let privateKey = key.importKey(finalLog, 'pkcs1-der')
      return privateKey
      }
      
}
/*const testFunc = async () => {
    const test = await login('Brennanjl', 'Ecclesia1')
    }
    testFunc()*/

    export default login