import axios from 'axios';
import gateway from '../gateway.js';
import getPhotoURL from '../internal/getPhotoURL.js';

const getGroupPreview = async (_group) => {
    _group = _group.toUpperCase();
    const url = gateway + '/' + _group + '/groupPreview';
    const params = {
        url: url,
        method: 'get',
        timeout: 20000,
    };
    let response = await axios(params);
    response=response.data
    if (response.photo_hash != '') {
        response.groupData.photo_url = getPhotoURL(response.groupData.photo_hash)
    }
    return response

};
export default getGroupPreview;
