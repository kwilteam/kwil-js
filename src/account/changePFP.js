import getAccountData from './getAccountData.js'
import privateKey from '../devKey.js'
import gateway from '../gateway.js'
import getFirstCharacter from '../internal/getFirstCharacter.js'
import axios from 'axios'
import rs from 'jsrsasign'
import checkSignature from '../internal/checkSignature.js'

const changePFP = async (_newPFP, _privateKey, _username) => {
    //Function for changing name and bio.  If you only wish to change one, leave the other as a blank string
    const privateKey = rs.KEYUTIL.getKey(_privateKey)
    let accountData = await getAccountData(_username)
    accountData.pfp = _newPFP

    const firstChar = getFirstCharacter(_username.toUpperCase())
    var sig = new rs.crypto.Signature({"alg": "SHA1withRSA"});
    sig.init(privateKey)
    sig.updateString(JSON.stringify(accountData))
    const dataSignature = sig.sign()

    //Check if image can be parsed
    try{
        let testString = JSON.stringify({data: accountData, signature: dataSignature})
        JSON.parse(testString)
        //JSON.parse(`{"data": ${accountData}, "signature": ${dataSignature}}`)
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
export default changePFP
/*let testFunc = async () => {
    await changePFP('Brennan Lamey', privateKey, 'Brennanjl')
}
testFunc()*/