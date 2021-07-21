import aes256 from 'aes256'
import axios from 'axios'
import gateway from '../gateway.js'
import rs from 'jsrsasign'

var createAccount = async (_username, _password) => {
    //username must be 5-20 characters
    //password must be 1 upper case, 1 lower case, 1 number, 8 characters

    const encryptKey = _username + _password
    const encryptedKey = aes256.encrypt(encryptKey, JSON.stringify(newRSAKey))
    let publicKey = cryptico.publicKeyString(newRSAKey)
    const _data = {'username': _username, 'login': encryptedKey, 'publicKey': publicKey}
    
    let dummyData = {'username': 'bubba', 'login': encryptedKey, 'publicKey': publicKey}

    let _url = gateway + '/createAccount'
    const params = {
        url: _url,
        method: 'post',
        timeout: 20000,
        headers: {"Content-Type": "application/json"},
        data: {data: _data, signature: dataSignature}
      }

      let response = await axios(params)
      console.log(response.data)

      return {'pubKey': publicKey, 'privateKey': privateKey}
    
}
export default createAccount
/*let testFunc = async () => {
let key = await arweave.wallets.generate()
let _transaction = await arweave.createTransaction({
    data: 'Hi!'
}, key);
await arweave.transactions.sign(_transaction, key)

let test = JSON.stringify(_transaction)
let test2 = JSON.parse(test)
console.log(arweave)
//console.log(arweave.transactions.crypto.verify())
console.log(await arweave.transactions.verify(test2))
}
/*onst testFunc = async () => {
const test = await createAccount('Brennanjl2', 'Ecclesia1')
}*/

class RSAKey {
    constructor(t) {
        //let temp = new BigInteger()
        //let temp2 = Object.assign(n)
        //this.n = temp2
        this.n = new BigInteger(t.n)
        this.e = t.e
        this.d = new BigInteger(t.d)
        this.p = new BigInteger(t.p)
        this.q = new BigInteger(t.q)
        this.dmp1 = new BigInteger(t.dmp1)
        this.dmq1 = new BigInteger(t.dmq1)
        this.coeff = new BigInteger(t.coeff)
        this.isPrivate = t.isPrivate;
        this.isPublic = t.isPublic;
      }
}
class BigInteger {
    constructor(_n) {
        for (const [_key, _value] of Object.entries(_n)) {
            this[_key] = _value
        }
    }
}
let keys = rs.KEYUTIL.generateKeypair("RSA", 512)
let pKey = keys.prvKeyObj
let test = JSON.stringify(pKey)
let test2 = {'RSAKey': JSON.parse(test)}
let t = JSON.parse(test)
//let test2 = new RSAKey(t)
if (test2 === pKey) {
    console.log('is same')
}
else {
    console.log(pKey)
    console.log('\n\n\n\n')
    console.log(test2)
}

for (const [_key, _value] of Object.entries(pKey)) {
    if (_value === test2[_key]) {
        console.log(`${_key} is the same`)
    }
    else{
        console.log(`${_value} invalid`)
    }
}
var sig = new rs.crypto.Signature({"alg": "SHA1withRSA"});
sig.init(test2)
sig.updateString('My String!')
let signature = sig.sign()
var sig2 = new rs.crypto.Signature({"alg": "SHA1withRSA"});
sig2.init(keys.pubKeyObj)
sig2.updateString('My String!')
var isValid = sig2.verify(signature)
console.log(isValid)
//console.log(sig)
//testFunc()