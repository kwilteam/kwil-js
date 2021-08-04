import rs from 'jsrsasign'
import privateKey from '../devKey.js'
import axios from 'axios'
import gateway from '../gateway.js'
import sign from '../internal/sign.js'
import getFirstCharacter from '../internal/getFirstCharacter.js'
import getFollowing from './getFollowing.js'
import getPublicJWKFromPrivateKey from '../internal/getPublicFromPrivate.js'

const unfollow = async (_username, _usernameToUnfollow, _privateJWK) => {
    const _privateKey = rs.KEYUTIL.getKey(_privateJWK)
    let firstChar = getFirstCharacter(_username)
    let followingList = await getFollowing(_username)
    if (!followingList.includes(_usernameToUnfollow)){
        console.log('User does not follow')
    } else {
        const index = followingList.indexOf(_usernameToUnfollow)
        if (index > -1) {
            followingList.splice(index, 1)
        }
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
      await axios(params)
    }
}

export default unfollow
/*const testFunc = async () => {
    await unfollow('Brennanjl', 'Brennanjl', privateKey)
}
testFunc()*/