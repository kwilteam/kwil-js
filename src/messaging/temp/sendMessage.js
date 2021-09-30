import axios from 'axios'
import gateway from '../../gateway.js'
import rs from 'jsrsasign'
import {Message, MessageBody, NewMessage, TempMessage} from '../../serverClasses.js'

const sendMessage = async(_sender, _receiver, _message, _privateJWK) => {
    _sender = _sender.toLowerCase()
    _receiver = _receiver.toLowerCase()
    const _privateKey = rs.KEYUTIL.getKey(_privateJWK)
    const msg = new TempMessage(_sender, _receiver, _message, Date.now())

    const _url = gateway + `/sendMessage`;
    const params = {
        url: _url,
        method: 'post',
        timeout: 20000,
        headers: { 'Content-Type': 'application/json' },
        data: msg
    }
    await axios(params)
    return msg
}

export default sendMessage