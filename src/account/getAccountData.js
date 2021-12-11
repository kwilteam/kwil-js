import gateway from '../gateway.js';
import hashPath from '../internal/hashPath.js';
import getFullAccountData from './getFullAccountData.js';

const getAccountData = async (_username) => {
    //Call this to get an account's name, bio, and profile picture
    const accountData = await getFullAccountData(_username);
    let photoURL = '';
    let bannerURL = ''
    if (accountData.photoHash != '' && accountData.photoHash != undefined) {
        photoURL =
            gateway + '/images' + hashPath(accountData.photoHash) + accountData.photoHash + '.jpg';
    }
    if (accountData.bannerHash != '' && accountData.bannerHash != undefined) {
        bannerURL =
            gateway + '/images' + hashPath(accountData.bannerHash) + accountData.bannerHash + '.jpg';
    }
    return {
        username: _username.toLowerCase(),
        name: accountData.name,
        bio: accountData.bio,
        pfp: photoURL,
        banner: bannerURL
    };
};

export default getAccountData;
