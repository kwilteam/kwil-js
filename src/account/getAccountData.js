import gateway from '../gateway.js';
import getPhotoURL from '../internal/getPhotoURL.js';
import hashPath from '../internal/hashPath.js';
import getFullAccountData from './getFullAccountData.js';

const getAccountData = async (_username) => {
    //Call this to get an account's name, bio, and profile picture
    const accountData = await getFullAccountData(_username);
    let photoURL = '';
    let bannerURL = '';
    console.log(accountData)
    if (accountData.pfpHash != '' && accountData.pfpHash != undefined) {
        photoURL = getPhotoURL(accountData.pfpHash)
    }
    if (accountData.bannerHash != '' && accountData.bannerHash != undefined) {
        bannerURL = getPhotoURL(accountData.bannerHash)
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
