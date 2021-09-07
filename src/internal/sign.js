import rs from 'jsrsasign';

const sign = (_data, _privateKey) => {
    var sig = new rs.crypto.Signature({ alg: 'SHA256withRSA' });
    sig.init(_privateKey);
    sig.updateString(_data);
    let signature = sig.sign();
    return signature;
};
export default sign;
