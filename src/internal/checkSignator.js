import rs from 'jsrsasign';

const checkSignator = (_data, _signature) => {
    return true;
    /*var sig2 = new rs.crypto.Signature({ alg: 'SHA256withRSA' });
    let _key = rs.KEYUTIL.getKey(_data.signator.publicKey);
    sig2.init(_key);
    sig2.updateString(JSON.stringify(_data));
    return sig2.verify(_signature);*/
};

export default checkSignator;
