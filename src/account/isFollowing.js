import axios from 'axios'
import gateway from '../gateway.js'

const isFollowing = async (_follower, _followee) => {
    let _url = gateway + `/`+_follower.toLowerCase()+'/'+_followee.toLowerCase()+'/isFollowing';
    const params = {
        url: _url,
        method: 'get',
        timeout: 20000,
    };
    const response = await axios(params);
    if (response.data == '') {
        return false
    } else {
        return true
    }
};

export default isFollowing;

/*let testFunc = async () => {
    console.log(await isFollowing('Brennanjl', 'Brennanjl'))
}
testFunc()*/
