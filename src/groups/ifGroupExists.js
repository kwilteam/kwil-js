import getGroupData from './getGroupData.js'
const ifGroupExists = async (_group) => {
    try {
        await getGroupData(_group)
        return true
    } catch(e)
    {return false}
}
export default ifGroupExists