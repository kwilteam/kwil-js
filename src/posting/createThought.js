import { gateway } from '../gateway.js';
import axios from 'axios';
import { NewThought } from '../classes.js';

const createThought = async (_postText, _img, _privateJWK, _username, _groupTag = null) => {
    let data = '';
    if (_groupTag != null) {
        data = new NewThought(
            _postText,
            _img,
            _privateJWK,
            _username.toLowerCase(),
            _groupTag.toUpperCase()
        );
    } else {
        data = new NewThought(_postText, _img, _privateJWK, _username.toLowerCase());
    }
    const _url = gateway + `/post`;
    const params = {
        url: _url,
        method: 'post',
        timeout: 20000,
        headers: { 'Content-Type': 'application/json' },
        data: data,
    };
    const response = await axios(params);
    return data;
};
export default createThought;
