import rs from 'jsrsasign'
import privateKey from '../devKey.js'
import axios from 'axios'
import gateway from '../gateway.js'
import sign from '../internal/sign.js'
import getFirstCharacter from '../internal/getFirstCharacter.js'
import getFollowing from './getFollowing.js'
import checkSignature from '../internal/checkSignature.js'
import getPublicJWKFromPrivateKey from '../internal/getPublicFromPrivate.js'

const follow = async (_username, _usernameToFollow, _privateJWK) => {
    const _privateKey = rs.KEYUTIL.getKey(_privateJWK)
    let firstChar = getFirstCharacter(_username)
    let followingList = await getFollowing(_username)
    if (followingList.includes(_usernameToFollow)){
        console.log('User already follows')
    } else {
        followingList.push(_usernameToFollow)
    let _data = {username: _username, publicKey: getPublicJWKFromPrivateKey(_privateKey), following: followingList}
    //Generate data signature
    const dataSignature = sign(JSON.stringify(_data), _privateKey)

    let _url = gateway +'/'+ firstChar + '/' + _username.toUpperCase() + '/following'
    const params = {
        url: _url,
        method: 'post',
        timeout: 20000,
        data: {data: _data, signature: dataSignature}
      }
      let response = await axios(params)
      console.log(response)
    }
}

export default follow

/*const testFunc = async () => {
    await follow('Brennanjl', 'Brennanjl', privateKey)
}
testFunc()*/