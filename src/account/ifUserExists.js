import getAccountData from '../account/getAccountData.js';
const ifUserExists = async (_usernameReg) => {
    let _username = _usernameReg.toUpperCase();
    try {
        await getAccountData(_username);
        return true;
    } catch (e) {
        return false;
    }
};

export default ifUserExists;
