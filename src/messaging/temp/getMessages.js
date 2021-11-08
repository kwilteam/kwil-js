import gateway from '../../gateway.js';
import axios from 'axios';

const getMessages = async (_username) => {
    const _url = gateway + '/' + _username.toLowerCase() + `/getMessages`;
    const params = {
        url: _url,
        method: 'get',
        timeout: 20000,
        headers: { 'Content-Type': 'application/json' },
    };
    let response = await axios(params);
    response = response.data;

    const correspondents = {};
    for (let i = 0; i < response.length; i++) {
        //Here I will loop through all senders and receivers, creating a list of all unique correspondents
        if (
            !Object.prototype.hasOwnProperty(correspondents, response[i].sender) &&
            response[i].sender !== _username
        ) {
            correspondents[response[i].sender] = [];
        }
        if (
            !Object.prototype.hasOwnProperty(correspondents, response[i].receiver) &&
            response[i].receiver !== _username
        ) {
            correspondents[response[i].receiver] = [];
        }
    }
    for (let corr in correspondents) {
        for (let i = 0; i < response.length; i++) {
            if (response[i].sender == corr || response[i].receiver == corr) {
                correspondents[corr].push(response[i]);
            }
        }
    }
    return correspondents;
};

export default getMessages;
