import gateway from '../gateway.js';
import axios from 'axios';
import rs from 'jsrsasign';
import sign from '../internal/sign.js';
import getFullAccountData from './getFullAccountData.js';
import sha384 from '../internal/sha384.js';

const changeBanner = async (_newBanner, _privateKey, _username) => {
    //Function for changing banner.
    const account = await getFullAccountData(_username.toLowerCase());
    const newHash = sha384(_newBanner);
    if (account.bannerHash != newHash) {
        account.bannerHash = newHash;
        account.timestamp = Date.now()
        const _url = gateway + `/changeAccountData`;
        const params = {
            url: _url,
            method: 'post',
            timeout: 20000,
            data: {
                data: account,
                banner: [_newBanner],
                signature: sign(JSON.stringify(account), rs.KEYUTIL.getKey(_privateKey)),
                changed: ['banner_hash'],
            },
        };
        await axios(params);
        return account;
    } else {
        console.log('That is already your banner');
        return account;
    }
};
export default changeBanner;
