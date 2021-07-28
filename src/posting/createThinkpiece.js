import getPublicJWKFromPrivateKey from '../internal/getPublicFromPrivate.js'
import sha256 from 'js-sha256'
import sign from '../internal/sign.js'
import axios from 'axios'
import gateway from '../gateway.js'
import privateKey from '../devKey.js'
import checkSignature from '../internal/checkSignature.js'
import rs from 'jsrsasign'

const createThinkpiece = async (_title, _postText, _img, _privateJWK, _username) => {
    //images should be entered as array of base64 encodings
    const _privateKey = rs.KEYUTIL.getKey(_privateJWK)
    let randTime = Date.now()
    let _data = {
        "postTitle": _title,
        "postText": _postText,
        "postPhotos": _img,
        "publicKey":  getPublicJWKFromPrivateKey(_privateKey),
        "type": "Thinkpiece",
        "timeStamp": randTime,
        "username": _username
            }
    let _signature = sign(JSON.stringify(_data), _privateKey)
    let _ID = sha256.sha256(_signature+randTime.toString())
    let postData = {"data": _data,
                    "signature": _signature,
                    "ID": _ID,
                    "username": _username}
    let _url = gateway + '/thinkpiece'
    //console.log(checkSignature(_data, _signature))
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
export default createThinkpiece

/*const testFunc = async () => {
    console.log(await createThinkpiece('Hi!', '', privateKey, 'Brennanjl'))
}
testFunc()*/