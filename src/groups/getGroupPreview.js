import getGroupData from './getGroupData.js';
import getGroupPosts from './getGroupPosts.js';

const getGroupPreview = async (_group) => {
    let groupData = await getGroupData(_group);
    let recentPost = await getGroupPosts(_group, 0, 1);
    return { groupData: groupData, recentPost: recentPost };
};
export default getGroupPreview;
