import getPublicJWKFromPrivateKey from '../internal/getPublicJWKFromPrivateKey.js'
import sha256 from 'js-sha256'
import sign from '../internal/sign.js'
import axios from 'axios'
import gateway from '../gateway.js'
import privateKey from '../devKey.js'
import checkSignature from '../internal/checkSignature.js'
import rs from 'jsrsasign'

const comment = async (_postText, _mainPostID, _privateJWK, _username) => {
    const _privateKey = rs.KEYUTIL.getKey(_privateJWK)
    if (typeof _username === 'undefined') {
        throw new Error('Username was not provided on the comment function')
    }
    let randTime = Date.now()
    let _data = {
        "postText": _postText,
        "publicKey":  getPublicJWKFromPrivateKey(_privateKey),
        "type": "Comment",
        "timeStamp": randTime,
        "referencing": _mainPostID,
        "username": _username
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
                
    await axios(params)
    
    return postData
}
export default comment

/*const testFunc = async () => {
    await comment('Hi!', 'bb71d85ea037edaed1f54b8bfbb8ebec61d4511fb51f37104c02223ac2c587ca', privateKey, 'Brennanjl')
}
testFunc()*/