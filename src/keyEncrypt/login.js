import gateway from '../gateway.js'
import aes256 from 'aes256'
import axios from 'axios'
import checkSignature from '../internal/checkSignature.js'
import rs from 'jsrsasign'
import getFirstCharacter from '../internal/getFirstCharacter.js'

const login = async (_username, _password) => {
    let firstChar = getFirstCharacter(_username)
    let _url = gateway + '/accounts/' + firstChar + '/' + _username.toUpperCase() + '/info'
    const params = {
        url: _url,
        method: 'get',
        timeout: 20000
      }
      try {
      let response = await axios(params)
      if (checkSignature(response.data.data, response.data.signature)){
      let loginCipher = response.data.data.login
      const encryptKey = _username.toLowerCase() + _password.toLowerCase()
      let privateKey = aes256.decrypt(encryptKey, loginCipher)
      return {"privateKey": JSON.parse(privateKey), "loginValid": true}
      }
      return {"privateKey": '', "loginValid": false}
    }
    catch (e) {
        console.log(e)
        return {"privateKey": '', "loginValid": false}
    }
}
    /*const testFunc = async () => {
    const test = await login('Brennanjl', 'Ecclesia1')
    console.log(test)
    }
    testFunc()*/

    export default login