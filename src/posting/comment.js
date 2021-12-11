import axios from 'axios';
import gateway from '../gateway.js';
import { NewComment } from '../classes.js';

const comment = async (_postText, _mainPostID, _privateJWK, _username, _referenceType) => {
    //_referenceType must be post or comment
    if (typeof _username === 'undefined') {
        //The only reason this is added is because the _username field was added in v2 of the API
        throw new Error('Username was not provided on the comment function');
    }
    if (_postText.length > 300) {
        throw new Error('Comment is longer than 300 characters');
    }
    if (
        _referenceType != 'post' &&
        _referenceType != 'comment'
    ) {
        throw new Error('Parameter _referenceType must be post or comment');
    }

    const data = new NewComment(
        _postText,
        _username.toLowerCase(),
        _mainPostID,
        _referenceType,
        _privateJWK
    );

    const _url = gateway + `/comment`;
    const params = {
        url: _url,
        method: 'post',
        timeout: 20000,
        headers: { 'Content-Type': 'application/json' },
        data: data,
    };

    const response = await axios(params);
    console.log(response.data)
    return data;
};
export default comment;
