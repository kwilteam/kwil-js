import { gateway } from "../gateway.js"
import axios from 'axios'

const getPostStats = async (_postID, _username = '') => {
    _username = _username.toLowerCase()
    const _url = gateway + `/${_username}/${_postID}/getPostStats`
    const params = {
        url: _url,
        method: 'get',
        timeout: 20000,
        headers: { 'Content-Type': 'application/json' }
    };
    const response = await axios(params)
    if (response.data.likeData) {
        return {isLiked: true, type: response.data.likeData.liked, likes: parseInt(response.data.likes), dislikes: parseInt(response.data.dislikes), comments: parseInt(response.data.comments)}
    } else {
        return {isLiked: false, type: null, likes: parseInt(response.data.likes), dislikes: parseInt(response.data.dislikes), comments: parseInt(response.data.comments)}
    }
}

export default getPostStats