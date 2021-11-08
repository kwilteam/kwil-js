import gateway from '../gateway.js';
import axios from 'axios';
import rs from 'jsrsasign';
import sign from '../internal/sign.js';
import getFullAccountData from './getFullAccountData.js';

const changeNameAndBio = async (_newName, _newBio, _privateKey, _username) => {
    //Function to change a user's name and bio.  If you don't want to change one, pass it an empty string.  EX: ecclesia.changeNameAndBio('Brennan Lamey Jr. The 5th', '', _privateKey, 'brennan')
    const account = await getFullAccountData(_username.toLowerCase());
    const changed = [];
    if (account.name != _newName) {
        changed.push('display_name');
        account.name = _newName;
    }
    if (account.bio != _newBio) {
        changed.push('bio');
        account.bio = _newBio;
    }

    let _url = gateway + `/changeAccountData`;
    const params = {
        url: _url,
        method: 'post',
        timeout: 20000,
        data: {
            data: account,
            signature: sign(JSON.stringify(account), rs.KEYUTIL.getKey(_privateKey)),
            changed: changed,
        },
    };
    await axios(params);
    return account;
};
export default changeNameAndBio;
