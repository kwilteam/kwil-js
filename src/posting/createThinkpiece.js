import axios from 'axios';
import gateway from '../gateway.js';
import { NewThinkpiece } from '../classes.js';

const createThinkpiece = async (
    _title,
    _postText,
    _img,
    _privateJWK,
    _username,
    _groupTag = null
) => {
    //images should be entered as array of base64 encodings

    if (_img.length == 1) {
        if (_img[0] == '') {
            _img = [];
        }
    }
    let data = '';
    if (_groupTag != null) {
        data = new NewThinkpiece(
            _title,
            _postText,
            _img,
            _privateJWK,
            _username.toLowerCase(),
            _groupTag.toUpperCase()
        );
    } else {
        data = new NewThinkpiece(_title, _postText, _img, _privateJWK, _username.toLowerCase());
    }

    let _url = gateway + `/post`;
    const params = {
        url: _url,
        method: 'post',
        timeout: 20000,
        headers: { 'Content-Type': 'application/json' },
        data: data,
    };

    const response = await axios(params);
    console.log(response.data);
    return data;
};
export default createThinkpiece;
