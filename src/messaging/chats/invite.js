import rs from 'jsrsasign';
import gateway from '../../gateway.js';
import getAccountData from '../../account/getAccountData.js';
import getFirstCharacter from '../../internal/getFirstCharacter.js';
import axios from 'axios';
import sign from '../../internal/sign.js';
import { sha256 } from 'js-sha256';

const invite = async (_text, _posterUsername, _receiverUsername, _privateKey) => {
    let receiverFirstC = getFirstCharacter(_receiverUsername);
    let otherAccount = await getAccountData(_receiverUsername);
    let othersPublic = rs.KEYUTIL.getKey(otherAccount.publicKey);
    console.log(rs.KEYUTIL.getJWKFromKey(othersPublic));
    let encryptedMessage = rs.crypto.Cipher.encrypt(_text, othersPublic, 'RSA');
    let encryptedName = rs.crypto.Cipher.encrypt(_posterUsername, othersPublic, 'RSA');
    let fileName = sha256(encryptedMessage + Date.now() + _posterUsername);

    //Signature
    let signature = sign(_posterUsername, _privateKey);

    let _url =
        gateway + `/${receiverFirstC}/${_receiverUsername.toUpperCase()}/${fileName}/invites`;
    const params = {
        url: _url,
        method: 'post',
        timeout: 20000,
        headers: { 'Content-Type': 'application/json' },
        data: {
            message: encryptedMessage,
            sender: encryptedName,
            signature: signature,
        },
    };

    await axios(params);
};

export default invite;
