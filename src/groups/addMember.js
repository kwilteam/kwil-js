import rs from 'jsrsasign'
import axios from 'axios'
import gateway from '../gateway.js'
import getFirstCharacter from '../internal/getFirstCharacter.js'
import getMembersJSON from './getMembersJSON.js'
import getPublicJWKFromPrivateKey from '../internal/getPublicJWKFromPrivateKey.js'
import sign from '../internal/sign.js'

const addMember = async (groupName, newMember, yourUsername, _privateJWK) => {
    //Adds a member to a group
    const _newMember = newMember.toUpperCase()
    const _groupName = groupName.toUpperCase()
    const _yourUsername = yourUsername.toUpperCase()
    const _privateKey = rs.KEYUTIL.getKey(_privateJWK)
    let membersJSON = await getMembersJSON(_groupName)
    let members = membersJSON.members
    if (members.includes(_newMember)) {
        console.log(`${_newMember} is already a member of ${_groupName}`)
        return {isValid: false, members: members}
    } else if (members.includes(_yourUsername)){
        members.push(_newMember)
        let finalData = {owner: membersJSON.owner, members: members, signator: {username: _yourUsername.toUpperCase(), publicKey: getPublicJWKFromPrivateKey(_privateKey)}}
        const dataSignature = sign(JSON.stringify(finalData), _privateKey)
        let firstChar = getFirstCharacter(_groupName)
        let _url = gateway + `/${firstChar}/${_groupName.toUpperCase()}/editMembers`
        const params = {
            url: _url,
            method: 'post',
            timeout: 20000,
            data: {data: finalData, signature: dataSignature}
        }
        await axios(params)
        return {isValid: true, members: members}
    } else {console.log(`${_yourUsername} is not allowed to add users to group ${_groupName}`)
        return {isValid: false, members: members}}
}

export default addMember