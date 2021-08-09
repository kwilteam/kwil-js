import getFollowingData from '../internal/getFollowingData.js'

const isFollowingGroup = async (_username, _groupName) => {
    let _data = await getFollowingData(_username)
    let groupList = _data.groups.map(group => group.toUpperCase())
    if (groupList.includes(_groupName.toUpperCase())) {
        return true
    } else {
        return false
    }
}  
export default isFollowingGroup