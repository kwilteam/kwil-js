import rs from 'jsrsasign';
import axios from 'axios';
import gateway from '../gateway.js';
import sign from '../internal/sign.js';

const addMember = async (groupName, newMember, yourUsername, _privateJWK) => {
    //Adds a member to a group
    groupName = groupName.toUpperCase();
    newMember = newMember.toLowerCase();
    yourUsername = yourUsername.toLowerCase();
    const _privateKey = rs.KEYUTIL.getKey(_privateJWK);
    const newMemberMessage = {
        moderator: yourUsername,
        newMember: newMember,
        added: true,
        group: groupName,
    };
    const dataSignature = sign(JSON.stringify(newMemberMessage), _privateKey);
    const url = gateway + '/addMember';
    const params = {
        url: url,
        method: 'post',
        timeout: 20000,
        data: {
            data: newMemberMessage,
            signator: { signature: dataSignature, username: yourUsername },
        },
    };
    const response = await axios(params);
    return response.data;
};

export default addMember;