import getGroupData from './getGroupData.js'
import getPublicFromPrivateJWK from '../internal/getPublicJWKFromPrivateKey.js'
import rs from 'jsrsasign'
import sign from '../internal/sign.js'
import getFirstCharacter from '../internal/getFirstCharacter.js'
import gateway from '../gateway.js'
import axios from 'axios'
import checkSignator from '../internal/checkSignator.js'

const editGroup = async (_groupName, _groupDescription, _public, _groupTags, _groupImage, _links, _color, _username, _privateJWK) => {
    //For any input that you do not want to change, pass the input an empty string
    const _privateKey = rs.KEYUTIL.getKey(_privateJWK)
    //Getting previous group data
    const groupData = await getGroupData(_groupName)
    if (typeof groupData !== 'undefined') {
        if (typeof groupData.signator !== 'undefined') {
            //We will now check all inputs for empty strings
            if (_groupDescription !== '') {
                groupData.description = _groupDescription
            }
            if (_public !== '') {
                groupData.public = _public
            }
            if (_groupTags !== '') {
                groupData.tags = _groupTags
            }
            if (_groupImage !== '') {
                groupData.image = _groupImage
            }
            if (_links !== '') {
                groupData.links = _links
            }
            let regex = /^#[0-9A-F]{6}$/i
            if (_color !== '' && regex.test(_color)) {
                groupData.color = _color
            }
            groupData.signator = {username: _username.toUpperCase(), publicKey: getPublicFromPrivateJWK(_privateKey)}
            const dataSignature = sign(JSON.stringify(groupData), _privateKey)
            let firstChar = getFirstCharacter(_groupName)
            let _url = gateway + `/${firstChar}/${_groupName.toUpperCase()}/editGroup`
            const params = {
                url: _url,
                method: 'post',
                timeout: 20000,
                data: {data: groupData, signature: dataSignature}
            }
            await axios(params)
            return groupData
        }
    }
}

export default editGroup