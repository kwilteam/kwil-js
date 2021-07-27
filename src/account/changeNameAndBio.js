import getAccountData from './getAccountData.js'
import privateKey from '../devKey.js'
import gateway from '../gateway.js'
import getFirstCharacter from '../internal/getFirstCharacter.js'
import axios from 'axios'
import rs from 'jsrsasign'
import checkSignature from '../internal/checkSignature.js'

const changeNameAndBio = async (_newName, _newBio, _privateKey, _username) => {
    //Function for changing name and bio.  If you only wish to change one, leave the other as a blank string
    const privateKey = rs.KEYUTIL.getKey(_privateKey)
    let accountData = await getAccountData(_username)
    let newName = ''
    if (_newName == '') {
        newName = accountData.data.name
    } else {
        newName = _newName
    }
    let newBio = ''
    if (_newBio == '') {
        newBio = accountData.data.bio
    } else {
        newBio = _newBio
    }
    let _data = accountData.data
    _data.name = newName
    _data.bio = newBio

    const firstChar = getFirstCharacter(_username.toUpperCase())
    var sig = new rs.crypto.Signature({"alg": "SHA1withRSA"});
    sig.init(privateKey)
    sig.updateString(JSON.stringify(_data))
    const dataSignature = sig.sign()
    
    let _url = gateway + `/${firstChar}/${_username.toUpperCase()}/changeNameAndBio`
    const params = {
        url: _url,
        method: 'post',
        timeout: 20000,
        data: {data: _data, signature: dataSignature}
      }
    let response = await axios(params)
    return response.data

}
export default changeNameAndBio
/*let testFunc = async () => {
    await changeNameAndBio('Brennan Lamey', 'Hi im brennan', privateKey, 'Brennanjl')
}
testFunc()*/