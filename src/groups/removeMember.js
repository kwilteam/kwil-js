import rs from 'jsrsasign'
import axios from 'axios'
import gateway from '../gateway.js'
import getFirstCharacter from '../internal/getFirstCharacter.js'
import getMembersJSON from './getMembersJSON.js'
import getPublicJWKFromPrivateKey from '../internal/getPublicFromPrivateJWK.js'
import sign from '../internal/sign.js'

const removeMember = async (groupName, removeMember, yourUsername, _privateJWK) => {
    //Adds a member to a group
    const _removeMember = removeMember.toUpperCase()
    const _groupName = groupName.toUpperCase()
    const _yourUsername = yourUsername.toUpperCase()
    const _privateKey = rs.KEYUTIL.getKey(_privateJWK)
    let membersJSON = await getMembersJSON(_groupName)
    let members = membersJSON.members
    if (!members.includes(_removeMember)) {
        console.log(`${_removeMember} is not a member of ${_groupName}`)
        return {isValid: false, members: members}
    } else if (members.includes(_yourUsername)){
        let index = members.indexOf(_removeMember)
        if (index > -1) {
            members.splice(index, 1)
        }
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
        console.log(await axios(params))
        return {isValid: true, members: members}
    } else {console.log(`${_yourUsername} is not allowed to remove users from group ${_groupName}`)
        return {isValid: false, members: members}}
}

export default removeMember