import axios from 'axios';
import { gateway } from '../gateway.js';
import getPhotoURL from '../internal/getPhotoURL.js';

const getGroupData = async (_groupName) => {
    _groupName = _groupName.toUpperCase();
    let _url = gateway + `/${_groupName}/groupData`;
    const params = {
        url: _url,
        method: 'get',
        timeout: 20000,
    };
    let response = await axios(params);
    response = response.data;
    response.group_name = _groupName;
    if (response.photo_hash != '' && response.photo_hash != null) {
        response.photo_url = getPhotoURL(response.photo_hash)
    }
    if (response.banner_hash != '') {
        response.banner_url = getPhotoURL(response.banner_hash)
    }
    return response;
};
export default getGroupData;
