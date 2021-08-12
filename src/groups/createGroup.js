import rs from 'jsrsasign'
import gateway from '../gateway.js'
import getFirstCharacter from '../internal/getFirstCharacter.js'
import getPublicJWKFromPrivateKey from '../internal/getPublicJWKFromPrivateKey.js'
import axios from 'axios'
import sign from '../internal/sign.js'
import followGroup from './followGroup.js'

const createGroup = async (_groupName, _public, _groupDescription, _groupTags, _groupImage, _links, _color, _creatorUsernameReg, _creatorPrivateJWK) => {
    /*Function to create a group.  Group name must be unique, a group will not be created if there is already a group of that name.
    Public must be either true or false.  False means that the group owner must manually allow individuals to join.
    Creator username and private jwk are pretty self-explanatory.
    Color must be fed in as hexidecimal
    */
   let regex = /^#[0-9A-F]{6}$/i
   if (!regex.test(_color)){
       throw new Error('Invalid Color')
   }
   const _creatorUsername = _creatorUsernameReg.toUpperCase()
   const _privateKey = rs.KEYUTIL.getKey(_creatorPrivateJWK)
   var membership = ''
   if (_public === true) {
       membership = ['public']
   } else {
       membership = [_creatorUsername]
   }
   let charter = {name: _groupName, public: _public, creator: _creatorUsernameReg, publicKey: getPublicJWKFromPrivateKey(_privateKey), timeStamp: Date.now()}
   const dataSignature = sign(JSON.stringify(charter), _privateKey)

   //Creating initial group data
   const groupData = {owner: _creatorUsernameReg, public: _public, description: _groupDescription, tags: _groupTags, image: _groupImage, links: _links, color: _color, signator: {username: _creatorUsername.toUpperCase(), publicKey: getPublicJWKFromPrivateKey(_privateKey)}}
   const dataSignature2 = sign(JSON.stringify(groupData), _privateKey)

   //Creating members list
   const membersList = {owner: _creatorUsernameReg, members: [_creatorUsernameReg], signator: {username: _creatorUsername.toUpperCase(), publicKey: getPublicJWKFromPrivateKey(_privateKey)}}
   const dataSignature3 = sign(JSON.stringify(membersList), _privateKey)

   let firstChar = getFirstCharacter(_groupName)

    let _url = gateway + `/${firstChar}/${_groupName.toUpperCase()}/createGroup`
    const params = {
        url: _url,
        method: 'post',
        timeout: 20000,
        data: [{data: charter, signature: dataSignature}, {data: groupData, signature: dataSignature2}, {data: membersList, signature: dataSignature3}]
    }
    await axios(params)
    followGroup(_groupName, _creatorUsername, _privateKey)
    return groupData
}
export default createGroup