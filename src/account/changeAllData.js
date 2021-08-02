import getAccountData from './getAccountData.js'
import privateKey from '../devKey.js'
import gateway from '../gateway.js'
import getFirstCharacter from '../internal/getFirstCharacter.js'
import axios from 'axios'
import rs from 'jsrsasign'

const changeAllData = async (_newName, _newBio, _newPFP, _privateKey, _username) => {
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
    let newPFP = ''
    if (_newPFP == '') {
        newPFP = accountData.data.pfp
    } else {
        newPFP = _newPFP
    }
    accountData.name = newName
    accountData.bio = newBio
    accountData.pfp = newPFP

    const firstChar = getFirstCharacter(_username.toUpperCase())
    var sig = new rs.crypto.Signature({"alg": "SHA1withRSA"});
    sig.init(privateKey)
    sig.updateString(JSON.stringify(accountData))
    const dataSignature = sig.sign()

    try{
        JSON.parse(`{data: ${accountData}, signature: ${dataSignature}`)
    }
    catch(e) {
        throw new Error('Image can not be posted')
    }
    
    let _url = gateway + `/${firstChar}/${_username.toUpperCase()}/changeNameAndBio`
    const params = {
        url: _url,
        method: 'post',
        timeout: 20000,
        data: {data: accountData, signature: dataSignature}
      }
    let response = await axios(params)
    console.log(response)
    return accountData

}
export default changeAllData