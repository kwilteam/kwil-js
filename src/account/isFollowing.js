import follow from './follow'
import getFollowing from './getFollowing'

const isFollowing = async (_follower, _followee) => {
    let followingList = await getFollowing(_follower)
    if (followingList.includes(_followee)) {
        return true
    } else {
        return false
    }
}

export default isFollowing

/*let testFunc = async () => {
    console.log(await isFollowing('Brennanjl', 'Brennanjl'))
}
testFunc()*/