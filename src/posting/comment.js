import getPublicJWKFromPrivateKey from '../internal/getPublicFromPrivate.js'
import sha256 from 'js-sha256'
import sign from '../internal/sign.js'
import axios from 'axios'
import gateway from '../gateway.js'
import privateKey from '../devKey.js'
import checkSignature from '../internal/checkSignature.js'
import rs from 'jsrsasign'

const comment = async (_postText, _mainPostID, _privateJWK, _username) => {
    const _privateKey = rs.KEYUTIL.getKey(_privateJWK)

    let randTime = Date.now()
    let _data = {
        "postText": _postText,
        "publicKey":  getPublicJWKFromPrivateKey(_privateKey),
        "type": "Comment",
        "timeStamp": randTime,
        "referencing": _mainPostID
            }
    let _signature = sign(JSON.stringify(_data), _privateKey)
    let _ID = sha256.sha256(_signature+randTime.toString())
    let postData = {"data": _data,
                    "signature": _signature,
                    "ID": _ID,
                    "username": _username,
                    "mainPostID": _mainPostID
                    }
    let _url = gateway + `/${_username}/comment`
    const params = {
                    url: _url,
                    method: 'post',
                    timeout: 20000,
                    headers: {"Content-Type": "application/json"},
                    data: postData
                      }
                
    let response = await axios(params)
    console.log(response.data)
    
    return postData
}
export default comment

/*const testFunc = async () => {
    await comment('Hi!', '3bf43ff441313b1fda118bceb4184bc9fc991a8ce5061553c750ae68ad3d91eb', privateKey, 'Brennanjl', 'Brennanjl', 'thought')
}
testFunc()*/