import getGroupData from './getGroupData.js';
import rs from 'jsrsasign';
import sign from '../internal/sign.js';
import gateway from '../gateway.js';
import axios from 'axios';
import sha384 from '../internal/sha384.js';

const editGroup = async (
    _groupName,
    _groupDescription,
    _public,
    _groupTags,
    _groupImage,
    _links,
    _color,
    _username,
    _privateJWK
) => {
    //For any input that you do not want to change, pass the input an empty string
    const _privateKey = rs.KEYUTIL.getKey(_privateJWK);
    //Getting previous group data
    const groupData = await getGroupData(_groupName);
    let photoHash = '';
    const changed = {};
    if (_groupImage != '') {
        photoHash = sha384(_groupImage);
    }
    if (groupData.group_name) {
        if (_groupDescription !== '') {
            groupData.group_description = _groupDescription;
            changed.group_description = _groupDescription;
        }
        if (_public !== '') {
            groupData.public = _public;
            changed.public = _public;
        }
        if (_groupTags !== '' && Array.isArray(_groupTags)) {
            groupData.tags = _groupTags;
            changed.tags = _groupTags;
        }
        if (photoHash !== '') {
            groupData.photo_hash = photoHash;
            changed.photo_hash = photoHash;
        }
        if (_links !== '' && Array.isArray(_links)) {
            groupData.links = _links;
            changed.links = _links;
        }
        let regex = /^#[0-9A-F]{6}$/i;
        if (_color !== '' && regex.test(_color)) {
            groupData.color = _color;
            changed.color = _color;
        }
    }
    groupData.timestamp = Date.now()
    const signator = {
        signature: sign(JSON.stringify(groupData), _privateKey),
        username: _username.toLowerCase(),
    };
    let dataObj = {};
    if (_groupImage != '') {
        dataObj.data = groupData;
        dataObj.signator = signator;
        dataObj.changed = changed;
        dataObj.image = _groupImage;
    } else {
        dataObj.data = groupData;
        dataObj.signator = signator;
        dataObj.changed = changed;
    }
    const _url = gateway + `/editGroup`;
    const params = {
        url: _url,
        method: 'post',
        timeout: 20000,
        data: dataObj,
    };
    const response = await axios(params);
    console.log(response.data);
    return groupData;
};

export default editGroup;
