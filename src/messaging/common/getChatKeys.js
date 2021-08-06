import getFirstCharacter from '../../internal/getFirstCharacter.js'
import aes256 from 'aes256'
import gateway from '../../gateway.js'
import axios from 'axios'

const getChatKeys = async (_username, _password) => {
    let firstChar = getFirstCharacter(_username)
    let _url = gateway + `/accounts/${firstChar}/${_username.toUpperCase()}/chats`
    const params = {
        url: _url,
        method: 'get',
        timeout: 20000
      }
    let response = await axios(params)
    let encryptedChats = response.data.data
    const encryptKey = _username+_password
    let decryptedChats = ''
    try{
        decryptedChats = aes256.decrypt(encryptKey, encryptedChats)
    }
    catch(e){
        console.log(e)
        throw new Error('There was an error.  Possibly an invalid username / password')
    }
    return JSON.parse(decryptedChats)
}

export default getChatKeys