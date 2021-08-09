import rs from 'jsrsasign'
import privateKey from '../devKey.js'
import axios from 'axios'
import gateway from '../gateway.js'
import sign from '../internal/sign.js'
import getFirstCharacter from '../internal/getFirstCharacter.js'
import getFollowingData from '../internal/getFollowingData.js'
import getPublicJWKFromPrivateKey from '../internal/getPublicJWKFromPrivateKey.js'

const follow = async (_username, _usernameToFollow, _privateJWK) => {
    const _privateKey = rs.KEYUTIL.getKey(_privateJWK)
    let firstChar = getFirstCharacter(_username)
    let followingData = await getFollowingData(_username)
    let followingList = followingData.following
    if (followingList.includes(_usernameToFollow)){
        console.log('User already follows')
    } else {
        followingList.push(_usernameToFollow)
        followingData.following=followingList
    //Generate data signature
    const dataSignature = sign(JSON.stringify(followingData), _privateKey)

    let _url = gateway +'/'+ firstChar + '/' + _username.toUpperCase() + '/following'
    const params = {
        url: _url,
        method: 'post',
        timeout: 20000,
        data: {data: followingData, signature: dataSignature}
      }
      await axios(params)
    }
}

export default follow

/*const testFunc = async () => {
    await follow('Brennanjl', 'Brennanjl', privateKey)
}
testFunc()*/