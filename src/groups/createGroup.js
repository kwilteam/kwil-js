import rs from 'jsrsasign'
import gateway from '../gateway.js'
import getFirstCharacter from '../internal/getFirstCharacter.js'
import getPublicJWKFromPrivateKey from '../internal/getPublicFromPrivateJWK.js'
import axios from 'axios'

const createGroup = async (_groupName, _public, _groupDescription, _groupTags, _groupImage, _links, _creatorUsername, _creatorPrivateJWK) => {
    /*Function to create a group.  Group name must be unique, a group will not be created if there is already a group of that name.
    Public must be either true or false.  False means that the group owner must manually allow individuals to join.
    Creator username and private jwk are pretty self-explanatory
    */
   const _privateKey = rs.KEYUTIL.getKey(_creatorPrivateJWK)
   var membership = ''
   if (_public === true) {
       membership = ['public']
   } else {
       membership = [_creatorUsername]
   }
   let charter = {name: _groupName, public: _public, creator: _creatorUsername, publicKey: getPublicJWKFromPrivateKey(_privateKey), timeStamp: Date.now()}
   var sig = new rs.crypto.Signature({"alg": "SHA1withRSA"});
   sig.init(_privateKey)
   sig.updateString(JSON.stringify(charter))
   const dataSignature = sig.sign()

   //Creating initial group data
   const groupData = {description: _groupDescription, tags: _groupTags, image: _groupImage, links: _links, signator: {username: _creatorUsername.toUpperCase(), publicKey: getPublicJWKFromPrivateKey(_privateKey)}}
   var sig2 = new rs.crypto.Signature({"alg": "SHA1withRSA"});
   sig2.init(_privateKey)
   sig2.updateString(JSON.stringify(groupData))
   const dataSignature2 = sig2.sign()

   //Creating members list
   const membersList = {owner: _creatorUsername, members: [_creatorUsername.toUpperCase()], signator: {username: _creatorUsername.toUpperCase(), publicKey: getPublicJWKFromPrivateKey(_privateKey)}}
   var sig3 = new rs.crypto.Signature({"alg": "SHA1withRSA"});
   sig3.init(_privateKey)
   sig3.updateString(JSON.stringify(membersList))
   const dataSignature3 = sig3.sign()

   let firstChar = getFirstCharacter(_groupName)

    let _url = gateway + `/${firstChar}/${_groupName.toUpperCase()}/createGroup`
    const params = {
        url: _url,
        method: 'post',
        timeout: 20000,
        data: [{data: charter, signature: dataSignature}, {data: groupData, signature: dataSignature2}, {data: membersList, signature: dataSignature3}]
    }
    let response = await axios(params)
    return groupData
}
export default createGroup