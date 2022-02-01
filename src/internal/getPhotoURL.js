import hashPath from './hashPath.js';
import getFilePath from './getFilePath.js'
import {moat} from '../gateway.js'

const getPhotoURL = (_hash) => {
    const path = hashPath(_hash);
    const filePath = getFilePath()
    return filePath + `/public/${moat}/images` + path + _hash + '.jpg';
};

export default getPhotoURL;
