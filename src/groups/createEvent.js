import { Event } from '../oldClasses.js';
import sign from '../internal/sign.js';
import rs from 'jsrsasign';
import gateway from '../gateway.js';
import getPublicJWKFromPrivateJWK from '../internal/getPublicJWKFromPrivateJWK.js';
import getFirstCharacter from '../internal/getFirstCharacter.js';
import axios from 'axios';

const createEvent = async (
    _eventName,
    _eventDesc,
    _eventTime,
    _country,
    _city,
    _tags,
    _group,
    _username,
    _privateJWK
) => {
    const _privateKey = rs.KEYUTIL.getKey(_privateJWK);
    const _publicKey = getPublicJWKFromPrivateJWK(_privateJWK);
    const event = new Event(
        _eventName,
        _eventDesc,
        _eventTime,
        _country,
        _city,
        _tags,
        _group,
        _username.toLowerCase(),
        _publicKey
    );
    const dataSignature = sign(JSON.stringify(event), _privateKey);
    const firstChar = getFirstCharacter(_group);
    const _url = gateway + `/${firstChar}/${_group.toUpperCase()}/createEvent`;
    const params = {
        url: _url,
        method: 'post',
        timeout: 20000,
        data: {
            data: event,
            signature: dataSignature,
        },
    };
    await axios(params);
    return event;
};
export default createEvent;
