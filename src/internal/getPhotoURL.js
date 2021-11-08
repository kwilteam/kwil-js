import gateway from '../gateway.js';
import hashPath from './hashPath.js';

const getPhotoURL = (_hash) => {
    const path = hashPath(_hash);
    return gateway + `/images` + path + _hash + '.jpg';
};

export default getPhotoURL;
