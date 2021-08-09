import getMembers from './getMembers.js'

const isMember = async (_username, _groupName) => {
    let groupData = await getMembers(_groupName)
    let members = groupData.map(member => member.toUpperCase())
    if (members.includes(_username.toUpperCase())) {
        return true
    } else {
        return false
    }
}
export default isMember