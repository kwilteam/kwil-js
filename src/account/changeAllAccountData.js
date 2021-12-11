import gateway from '../gateway.js';
import axios from 'axios';
import rs from 'jsrsasign';
import sign from '../internal/sign.js';
import getFullAccountData from './getFullAccountData.js';
import sha384 from '../internal/sha384.js';

const changeAllAccountData = async (_newName, _newBio, _newPFP, _newBanner, _privateKey, _username) => {
    //Function to change a user's name and bio.  If you don't want to change one, pass it an empty string.  EX: ecclesia.changeNameAndBio('Brennan Lamey Jr. The 5th', '', _privateKey, 'brennan')
    const account = await getFullAccountData(_username.toLowerCase());
    const changed = [];
    const sendData = {}
    if (account.name != _newName && _newName != '') {
        changed.push('display_name');
        account.name = _newName;
    }
    if (account.bio != _newBio && _newBio != '') {
        changed.push('bio');
        account.bio = _newBio;
    }
    if (_newBanner != '') {
        let bannerHash = sha384(_newBanner)
        if (account.bannerHash != bannerHash) {
            account.bannerHash = bannerHash;
            changed.push('banner_hash')
            sendData.banner = [_newBanner]
        }
    }
    if (_newPFP != '') {
        let pfpHash = sha384(_newPFP)
        if (account.pfpHash != pfpHash) {
            account.pfpHash = pfpHash;
            changed.push('pfp_hash')
            sendData.photo = [_newPFP]
        }
    }

    //Set all of these
    account.timestamp = Date.now()
    sendData.data = account
    sendData.signature = sign(JSON.stringify(account), rs.KEYUTIL.getKey(_privateKey))
    sendData.changed = changed
    
    const _url = gateway + `/changeAccountData`;
    const params = {
        url: _url,
        method: 'post',
        timeout: 20000,
        data: sendData
    };
    await axios(params);
    return account;
};
export default changeAllAccountData;