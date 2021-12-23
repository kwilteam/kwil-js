import hashPath from './hashPath.js';
import getFilePath from './getFilePath.js'

const getPhotoURL = (_hash) => {
    const path = hashPath(_hash);
    const filePath = getFilePath()
    return filePath + `/images` + path + _hash + '.jpg';
};

export default getPhotoURL;
