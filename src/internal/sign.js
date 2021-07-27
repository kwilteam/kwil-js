import rs from 'jsrsasign'
import {isJson} from '../utility/utilities.js'

const sign = (_data, _privateKey) => {
    var sig = new rs.crypto.Signature({"alg": "SHA1withRSA"});
    sig.init(_privateKey)
    sig.updateString(_data)
    let signature = sig.sign()
    return signature
}
export default sign