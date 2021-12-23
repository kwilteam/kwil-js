import gateway from '../gateway.js';
import axios from 'axios';
import { NewGroup } from '../classes.js';
import followGroup from './followGroup.js';

const createGroup = async (
    _groupName,
    _public,
    _groupDescription,
    _groupTags,
    _rules,
    _groupImage,
    _groupBanner,
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
   if (_color != '') {
    let regex = /^#[0-9A-F]{6}$/i;
    if (!regex.test(_color)) {
        throw new Error('Invalid Color');
    }
}

    const data = new NewGroup(
        _groupName,
        _public,
        _groupDescription,
        _groupTags,
        _rules,
        _groupImage,
        _groupBanner,
        _links,
        _color,
        _creatorUsernameReg,
        _creatorPrivateJWK
    );
    let _url = gateway + `/createGroup`;
    const params = {
        url: _url,
        method: 'post',
        timeout: 30000,
        data: data,
    };
    const response = await axios(params);
    console.log(response.data);
    await followGroup(_groupName.toUpperCase(), _creatorUsernameReg.toLowerCase(), _creatorPrivateJWK)
    return data;
};
export default createGroup;
