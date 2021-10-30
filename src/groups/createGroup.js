import rs from 'jsrsasign';
import gateway from '../gateway.js';
import getFirstCharacter from '../internal/getFirstCharacter.js';
import getPublicJWKFromPrivateKey from '../internal/getPublicJWKFromPrivateKey.js';
import axios from 'axios';
import sign from '../internal/sign.js';
import followGroup from './followGroup.js';
import { NewGroup } from '../classes.js';

const createGroup = async (
    _groupName,
    _public,
    _groupDescription,
    _groupTags,
    _groupImage,
    _links,
    _color,
    _creatorUsernameReg,
    _creatorPrivateJWK
) => {
    /*Function to create a group.  Group name must be unique, a group will not be created if there is already a group of that name.
    Public must be either true or false.  False means that the group owner must manually allow individuals to join.
    Creator username and private jwk are pretty self-explanatory.
    Color must be fed in as hexidecimal
    */
    let regex = /^#[0-9A-F]{6}$/i;
    if (!regex.test(_color)) {
        throw new Error('Invalid Color');
    }

    const data = new NewGroup(_groupName, _public, _groupDescription, _groupTags, _groupImage, _links, _color, _creatorUsernameReg, _creatorPrivateJWK)

    let _url = gateway + `/createGroup`;
    const params = {
        url: _url,
        method: 'post',
        timeout: 20000,
        data: data,
    };
    const response = await axios(params)
    console.log(response.data)
    return data;
};
export default createGroup;
