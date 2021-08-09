import rs from 'jsrsasign'
import gateway from '../../gateway.js'
import privateKey from '../../devKey.js'
import getAccountData from '../../account/getAccountData.js'
import getFirstCharacter from '../../internal/getFirstCharacter.js'
import axios from 'axios'
import sign from '../../internal/sign.js'

const invite = async (_text, _posterUsername, _receiverUsername, _privateKey) => {
    let receiverFirstC = getFirstCharacter(_receiverUsername)
    let otherAccount = await getAccountData(_receiverUsername)
    let othersPublic = rs.KEYUTIL.getKey(otherAccount.publicKey)
    console.log(rs.KEYUTIL.getJWKFromKey(othersPublic))
    let encryptedMessage = rs.crypto.Cipher.encrypt(_text, othersPublic, 'RSA')
    let encryptedName = rs.crypto.Cipher.encrypt(_posterUsername, othersPublic, 'RSA')

    //Signature
    let signature = sign(_text, _privateKey)

    let _url = gateway + `/${receiverFirstC}/${_receiverUsername.toUpperCase()}/${encryptedName}/invites`
    const params = {
                    url: _url,
                    method: 'post',
                    timeout: 20000,
                    headers: {"Content-Type": "application/json"},
                    data: {message: encryptedMessage, signature: signature}
                      }
                
    await axios(params)
}

export default invite