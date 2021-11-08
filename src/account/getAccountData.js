import gateway from '../gateway.js';
import hashPath from '../internal/hashPath.js';
import getFullAccountData from './getFullAccountData.js';

const getAccountData = async (_username) => {
    //Call this to get an account's name, bio, and profile picture
    const accountData = await getFullAccountData(_username);
    let photoURL = '';
    if (accountData.photoHash != '' && accountData.photoHash != undefined) {
        photoURL =
            gateway + '/images' + hashPath(accountData.photoHash) + accountData.photoHash + '.jpg';
    }
    return {
        username: _username.toLowerCase(),
        name: accountData.name,
        bio: accountData.bio,
        pfp: photoURL,
    };
};

export default getAccountData;
