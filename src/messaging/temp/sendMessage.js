import axios from 'axios';
import { gateway } from '../../gateway.js';
import { TempMessage } from '../../classes.js';

const sendMessage = async (_sender, _receiver, _message) => {
    _sender = _sender.toLowerCase();
    _receiver = _receiver.toLowerCase();
    const msg = new TempMessage(_sender, _receiver, _message, Date.now());

    const _url = gateway + `/sendMessage`;
    const params = {
        url: _url,
        method: 'post',
        timeout: 20000,
        headers: { 'Content-Type': 'application/json' },
        data: msg,
    };
    await axios(params);
    return msg;
};

export default sendMessage;
