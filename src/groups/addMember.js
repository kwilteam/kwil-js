import rs from 'jsrsasign';
import axios from 'axios';
import gateway from '../gateway.js';
import sign from '../internal/sign.js';
import getGroupData from './getGroupData.js';

const addMember = async (groupName, newMember, yourUsername, _privateJWK) => {
    //Adds a member to a group
    groupName = groupName.toUpperCase();
    newMember = newMember.toLowerCase();
    yourUsername = yourUsername.toLowerCase();
    const _privateKey = rs.KEYUTIL.getKey(_privateJWK);
    const groupData = await getGroupData(groupName)
    const changed = {}
    const time = new Date
    if (!groupData.moderators.includes(newMember)) {
        groupData.moderators.push(newMember)
        groupData.timestamp = time
        changed['moderators'] = groupData.moderators
        changed['post_time'] = time
    } else {
        console.log('User is already a moderator in the group')
    }
    const dataSignature = sign(JSON.stringify(groupData), _privateKey);
    const url = gateway + '/editGroup';
    const params = {
        url: url,
        method: 'post',
        timeout: 20000,
        data: {
            data: groupData,
            changed: changed,
            signator: { signature: dataSignature, username: yourUsername },
        },
    };
    const response = await axios(params);
    return response.data;
};

export default addMember;