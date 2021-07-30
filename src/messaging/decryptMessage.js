import rs from 'jsrsasign'
import getAccountData from '../account/getAccountData.js'

const decryptMessage = async (_message, _privateKeyJWK) => {
    const _privateKey = rs.KEYUTIL.getKey(_privateKeyJWK)
    let _data = JSON.parse(_message.data)
    let senderUsername = rs.crypto.Cipher.decrypt(_message.sender, _privateKey, 'RSA')
    let decryptedMessage = rs.crypto.Cipher.decrypt(_data.message, _privateKey, 'RSA')
    let accountData = await getAccountData(senderUsername)
    var sig2 = new rs.crypto.Signature({"alg": "SHA256withRSA"});
    let _key = rs.KEYUTIL.getKey(accountData.publicKey)
    sig2.init(_key)
    sig2.updateString(decryptedMessage)
    let validSig = sig2.verify(_data.signature)
    if (validSig) {
        return {isValid: validSig, message: decryptedMessage, sender: senderUsername}
    } else {
        return {isValid: validSig}
    }
}

export default decryptMessage