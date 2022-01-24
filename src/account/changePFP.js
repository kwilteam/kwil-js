import gateway from '../gateway.js';
import axios from 'axios';
import rs from 'jsrsasign';
import sign from '../internal/sign.js';
import getFullAccountData from './getFullAccountData.js';
import sha384 from '../internal/sha384.js';

const changePFP = async (_newPFP, _privateKey, _username) => {
    //Function for changing pfp.
    const account = await getFullAccountData(_username.toLowerCase());
    const newHash = sha384(_newPFP);
    if (account.photoHash != newHash) {
        account.photoHash = newHash;
        account.timestamp = Date.now()
        const _url = gateway + `/changeAccountData`;
        const params = {
            url: _url,
            method: 'post',
            timeout: 20000,
            data: {
                data: account,
                photo: [_newPFP],
                signature: sign(JSON.stringify(account), rs.KEYUTIL.getKey(_privateKey)),
                changed: ['pfp_hash'],
            },
        };
        await axios(params);
        return account;
    } else {
        console.log('That is already your pfp');
        return account;
    }
};
export default changePFP;
