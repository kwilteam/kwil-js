import getGroupData from './getGroupData.js';
import rs from 'jsrsasign';
import sign from '../internal/sign.js';
import { gateway } from '../gateway.js';
import axios from 'axios';
import sha384 from '../internal/sha384.js';
import changePFP from '../account/changePFP.js';

const editGroup = async (
    _groupName,
    _public,
    _groupDescription,
    _groupTags,
    _rules,
    _groupImage,
    _groupBanner,
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
    let bannerHash = ''
    const changed = {};
    let dataObj = {};
    if (_groupImage != '' && _groupImage != null) {
        photoHash = sha384(_groupImage);
    }
    if (_groupBanner != '' && _groupBanner != null) {
        bannerHash = sha384(_groupBanner);
    }
    if (groupData.group_name) {
        if (_groupDescription != '') {
            groupData.group_description = _groupDescription;
            changed.group_description = _groupDescription;
        }
        if (_public != '') {
            groupData.public = _public;
            changed.public = _public;
        }
        if (_groupTags != '' && Array.isArray(_groupTags)) {
            groupData.tags = _groupTags;
            changed.tags = _groupTags;
        }
        if (_rules != '' && Array.isArray(_rules)) {
            groupData.rules = _rules
            changed.rules = _rules
        }
        if (photoHash != '') {
            groupData.photoHash = photoHash; //This is here because the backend reads photo writes in camel case
            changed.photo_hash = photoHash;
            dataObj.photo = [_groupImage]
        } else if (_groupImage == null) {
            groupData.photoHash = ''
            changed.photo_hash = ''
        }
        if (bannerHash != '') {
            groupData.bannerHash = bannerHash; //This is here because the backend reads photo writes in camel case
            changed.banner_hash = bannerHash;
            dataObj.banner = [_groupBanner]
        } else if (_groupBanner == null) {
            groupData.bannerHash = ''
            changed.banner_hash = ''
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
    } else {throw new Error('Group data could not be found for this group')}
    groupData.timestamp = Date.now()
    const signator = {
        signature: sign(JSON.stringify(groupData), _privateKey),
        username: _username.toLowerCase(),
    };

    dataObj.data = groupData;
    dataObj.signator = signator;
    dataObj.changed = changed;
    console.log('   CHANGED OBJECT: ')
    console.log(dataObj.changed)

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
