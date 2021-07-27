import rs from 'jsrsasign'
import gateway from '../gateway.js'
import privateKey from '../devKey.js'
import getAccountData from '../account/getAccountData.js'
import getFirstCharacter from '../internal/getFirstCharacter.js'
import getPublicFromPrivate from '../internal/getPublicFromPrivate.js'

const sendMessage = async (_text, _posterUsername, _receiverUsername, _privateKey) => {
    let posterFirstC = getFirstCharacter(_posterUsername)
    let receiverFirstC = getFirstCharacter(_receiverUsername)
    let otherAccount = await getAccountData(_receiverUsername)
    let othersPublic = otherAccount.data.publicKey
    let posterPublic = rs.KEYUTIL.getKey(getPublicFromPrivate(_privateKey))
    let encryptedOutMessage = rs.crypto.Cipher.encrypt(_text, rs.KEYUTIL.getKey(othersPublic), 'RSA')
    let encryptedInMessage = rs.crypto.Cipher.encrypt(_text, posterPublic, 'RSA')

    let _url = gateway + `/${_mainPostUsername.toUpperCase()}/${mainPostType}/${_mainPostID}/comment`
    const params = {
                    url: _url,
                    method: 'post',
                    timeout: 20000,
                    headers: {"Content-Type": "application/json"},
                    data: postData
                      }
                
    let response = await axios(params)
    console.log(response.data)
}

const testFunc = async () => {
    console.log(Date.now())
    let keys = rs.KEYUTIL.generateKeypair('RSA', 4096)
    let pKey = keys.prvKeyObj
    let pubKey = keys.pubKeyObj
    console.log('keys genned')
    console.log(Date.now())
    let encryptedMessage = rs.crypto.Cipher.encrypt('Hi there fuckface!', pubKey, 'RSA')
    console.log('encrypted')
    console.log(Date.now())
    let decryptedMessage = rs.crypto.Cipher.decrypt(encryptedMessage, pKey, 'RSA')
    console.log('decrypted')
    console.log(Date.now())
    
   // await sendMessage('Hi there motherfucker!  How are you encryption!!!', 'Brennanjl', 'Brennanjl', pKey)
}
testFunc()