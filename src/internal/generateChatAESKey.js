import scrypt from 'scrypt-js'
import sha384 from './sha384.js'

const generateChatAESKey = async (_p, _q) => {
    _p = sha384(_p)
    _q = sha384(_q)
    const scryptHash = await scrypt.scrypt(Buffer.from(_p.normalize('NFKC')), Buffer.from(_q.normalize('NFKC')), 8192, 8, 1, 32)
    return scryptHash.toString()
}

export default generateChatAESKey