import { gateway } from '../gateway.js';
import axios from 'axios';

const getPostByID = async (_ID) => {
    const _url = gateway + `/${_ID}/getPostByID`;
    const params = {
        url: _url,
        method: 'get',
        timeout: 20000,
    };
    const response = await axios(params);
    return response.data;
};

export default getPostByID;
