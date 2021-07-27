import getPublicJWKFromPrivateKey from '../internal/getPublicFromPrivate.js'
import sha256 from 'js-sha256'
import sign from '../internal/sign.js'
import axios from 'axios'
import gateway from '../gateway.js'
import privateKey from '../devKey.js'
import rs from 'jsrsasign'

const reComment = async (_postText, _mainPostID, _privateJWK, _username, _mainPostUsername, _mainPostType, _mainCommentID) => {
    const _privateKey = rs.KEYUTIL.getKey(_privateJWK)
    let mainPostType = ''
    if (_mainPostType.toUpperCase() == 'THOUGHT') {
        mainPostType = mainPostType+'thoughts'
    }
    else if (_mainPostType.toUpperCase() =='THINKPIECE') {
        mainPostType = mainPostType+'thinkpieces'
    }
    else {
        mainPostType = mainPostType + _mainPostType
    }

    let randTime = Date.now()
    let _data = {
        "postText": _postText,
        "publicKey":  getPublicJWKFromPrivateKey(_privateKey),
        "type": "Comment",
        "timeStamp": randTime
            }
    let _signature = sign(JSON.stringify(_data), _privateKey)
    let _ID = sha256.sha256(_signature+randTime.toString())
    let postData = {"data": _data,
                    "signature": _signature,
                    "ID": _ID,
                    "username": _username,
                    "mainPostOwner": _mainPostUsername,
                    "mainPostID": _mainPostID,
                    "mainPostType": mainPostType,
                    "mainCommentID": _mainCommentID
                    }
    let _url = gateway + `/${_mainPostUsername.toUpperCase()}/${mainPostType}/${_mainPostID}/${_mainCommentID}/recomment`
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
export default reComment

/*const testFunc = async () => {
    await reComment('Hi!', '9f443fdeda7005186cbf8acb998bc58c42879e4968dc9925fbab0fc5aeea1513', privateKey, 'Brennanjl', 'Brennanjl', 'thought', '3652d086203772f6dabce1b600918402c76adb17b3f367949b0fc954f75b9491')
}
testFunc()*/