import crypto from 'crypto'
import {base64encode} from '../utility/utilities.js'
import buffer from 'buffer'

const checkSignature = (_incomingData) => {
    let parsedData =_incomingData
    let pubKeyCheck = '-----BEGIN PUBLIC KEY-----\n'+parsedData.data.publicKey+'\n-----END PUBLIC KEY-----'
    return crypto.verify('SHA256', base64encode(parsedData.data), pubKeyCheck, buffer.Buffer.from(parsedData.signature))
}

export default checkSignature