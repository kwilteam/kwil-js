import getPFP from './getPFP.js'
import privateKey from '../devKey.js'
import gateway from '../gateway.js'
import getFirstCharacter from '../internal/getFirstCharacter.js'
import axios from 'axios'
import rs from 'jsrsasign'
import sign from '../internal/sign.js'

const changePFP = async (_newPFP, _privateKey, _username) => {
    //Function for changing name and bio.  If you only wish to change one, leave the other as a blank string
    const privateKey = rs.KEYUTIL.getKey(_privateKey)
    let pfpData = await getPFP(_username)
    pfpData.pfp = _newPFP

    const firstChar = getFirstCharacter(_username.toUpperCase())
    const dataSignature = sign(JSON.stringify(pfpData), privateKey)

    //Check if image can be parsed
    try{
        let testString = JSON.stringify({data: pfpData, signature: dataSignature})
        JSON.parse(testString)
        //JSON.parse(`{"data": ${accountData}, "signature": ${dataSignature}}`)
    }
    catch(e) {
        throw new Error('Image can not be posted')
    }
    
    let _url = gateway + `/${firstChar}/${_username.toUpperCase()}/changePFP`
    const params = {
        url: _url,
        method: 'post',
        timeout: 20000,
        data: {data: pfpData, signature: dataSignature}
      }
    await axios(params)
    return pfpData

}
export default changePFP
/*let testFunc = async () => {
    await changePFP('Brennan Lamey', privateKey, 'Brennanjl')
}
testFunc()*/