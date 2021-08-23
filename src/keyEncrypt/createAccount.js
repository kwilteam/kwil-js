import aes256 from 'aes256'
import axios from 'axios'
import gateway from '../gateway.js'
import rs from 'jsrsasign'
import getPublicJWKFromPrivateKey from '../internal/getPublicJWKFromPrivateKey.js'
import getFirstCharacter from '../internal/getFirstCharacter.js'
import sign from '../internal/sign.js'
import {User} from '../classes.js'

const createAccount = async (_username, _password) => {
    //username must be 5-20 characters
    //password must be 1 upper case, 1 lower case, 1 number, 8 characters
    if (_username.length > 30) {
      throw new Error('Name to long')
    }

    const firstChar = getFirstCharacter(_username)

    //Check for window.crypto.subtle
    let keyArr = []
    if (typeof window === 'object') {
      if (typeof window.crypto === 'object') {
        let keyPair = await window.crypto.subtle.generateKey(
          {
              name: "RSA-PSS",
              modulusLength: 4096, //can be 1024, 2048, or 4096
              publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
              hash: {name: "SHA-256"}, //can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
          },
          true, //whether the key is extractable (i.e. can be used in exportKey)
          ["sign", "verify"] //can be any combination of "sign" and "verify"
      )
      let jwk = await window.crypto.subtle.exportKey('jwk', keyPair.privateKey)
      console.log(jwk)
      let privateKey = rs.KEYUTIL.getKey(jwk)
      keyArr.push(privateKey)
      }
    } else {
        console.log('window.crypto not available.  Key generation may take a while...')
        let keyPair = rs.KEYUTIL.generateKeypair("RSA", 4096)
        keyArr.push(keyPair.prvKeyObj)
    }
    /*IF THIS SECTION THROWS ERROR, EXPORT SUBTLE CRYPTO KEYPAIR AS JWK AND REIMPORT WITH JSRSASIGN
    EX:
    let jwk = await window.crypto.subtle.exportKey('jwk', keys.privateKey)
    let privateKey = rs.KEYUTIL.getKey(jwk)
    */
    //RSAJSSIGN section
    const privateKey = keyArr[0]
    const rsaJWK = rs.KEYUTIL.getJWKFromKey(privateKey)
    const publicKey = getPublicJWKFromPrivateKey(privateKey)
    const encryptKey = _username.toLowerCase() + _password.toLowerCase()
    const encryptedKey = aes256.encrypt(encryptKey, JSON.stringify(rsaJWK))
    const _data = {'username': _username, 'login': encryptedKey, 'publicKey': publicKey}
    
    //Generate data signature with JSRSASIGN
    const dataSignature = sign(JSON.stringify(_data), privateKey)
    //console.log(rs.KEYUTIL.getJWKFromKey(privateKey))

    let accountData = {
      "username": _username,
      "name": '',
      "bio": '',
      "publicKey": publicKey
    }

    const accountDataSignature = sign(JSON.stringify(accountData), privateKey)

    let pfp = {
      "pfp": ''
    }
    const pfpSignature = sign(JSON.stringify(pfp), privateKey)

    //Creating follower data
    //const followers = {publicKey: publicKey, username: _username, following: [_username.toUpperCase()]}
    const followers = {publicKey: publicKey, username: _username, following: [_username.toUpperCase(), 'MICKEYMOUSE', 'SATOSHI', 'THEANTIJERRY', 'THEANTITOM', 'EDSNOWDEN', 'SHAKESPEARE'], groups: []}
    const followDataSignature = sign(JSON.stringify(followers), privateKey)

    //Creating chats passphrase data
    const chats = {}
    const encryptedChats = aes256.encrypt(encryptKey, JSON.stringify(chats))
    const chatsDataSignature = sign(encryptedChats, privateKey)

    let _url = gateway + '/'+firstChar +'/'+ _username.toUpperCase() +'/createAccount'
    const params = {
        url: _url,
        method: 'post',
        timeout: 20000,
        headers: {"Content-Type": "application/json"},
        data: [{data: _data, signature: dataSignature},{data: accountData, signature: accountDataSignature}, {data: followers, signature: followDataSignature}, {data: encryptedChats, signature: chatsDataSignature}]
      }
      let response = await axios(params)
      //let newUser = new User(_username, publicKey, encryptKey, dataSignature, accountDataSignature, pfpSignature, followDataSignature)
      return {'pubKey': publicKey, 'privateKey': rsaJWK}
    
}
export default createAccount

/*const testFunc = async () => {
const test = await createAccount('Brennanjl', 'Ecclesia1')
}

testFunc()*/