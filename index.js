import createAccount from './src/keyEncrypt/createAccount.js';
import changeNameAndBio from './src/account/changeNameAndBio.js';
import changePFP from './src/account/changePFP.js';
import getPFP from './src/account/getPFP.js';
import follow from './src/account/follow.js';
import getAccountData from './src/account/getAccountData.js';
import getFollowing from './src/account/getFollowing.js';
import isFollowing from './src/account/isFollowing.js';
import unfollow from './src/account/unfollow.js';
import login from './src/keyEncrypt/login.js';
import comment from './src/posting/comment.js';
import createThinkpiece from './src/posting/createThinkpiece.js';
import createThought from './src/posting/createThought.js';
import getComments from './src/posting/getComments.js';
import getFeed from './src/posting/getFeed.js';
import getPosts from './src/posting/getPosts.js';
import getThinkpieces from './src/posting/getThinkpieces.js';
import getThoughts from './src/posting/getThoughts.js';
import decryptMessage from './src/messaging/decryptMessage.js';
import getInbox from './src/messaging/getInbox.js';
import getMessages from './src/messaging/getMessages.js';
import sendMessage from './src/messaging/common/sendMessage.js';
import createGroup from './src/groups/createGroup.js';
import editGroup from './src/groups/editGroup.js';
import addMember from './src/groups/addMember.js';
import removeMember from './src/groups/removeMember.js';
import getGroupData from './src/groups/getGroupData.js';
import getMembers from './src/groups/getMembers.js';
import isFollowingGroup from './src/groups/isFollowingGroup.js';
import isMember from './src/groups/isMember.js';
import getGroups from './src/groups/getGroups.js';
import ifUserExists from './src/account/ifUserExists.js';
import invite from './src/messaging/chats/invite.js';
import createChat from './src/messaging/chats/createChat.js';
import getGroupPosts from './src/groups/getGroupPosts.js';
import getGroupPreview from './src/groups/getGroupPreview.js';
import getPostByID from './src/posting/getPostByID.js';
import followGroup from './src/groups/followGroup.js';
import unfollowGroup from './src/groups/unfollowGroup.js';
import sign from './src/internal/sign.js';
import like from './src/interactions/like.js';
import ifGroupExists from './src/groups/ifGroupExists.js';
import createEvent from './src/groups/createEvent.js';
import getNameAndBio from './src/account/getNameAndBio.js';

const ecclesia = {
    createAccount,
    changeNameAndBio,
    getNameAndBio,
    changePFP,
    getPFP,
    follow,
    getAccountData,
    getFollowing,
    isFollowing,
    unfollow,
    login,
    comment,
    createThinkpiece,
    createThought,
    getComments,
    getFeed,
    getPosts,
    getThinkpieces,
    getThoughts,
    decryptMessage,
    getInbox,
    getMessages,
    sendMessage,
    createGroup,
    editGroup,
    addMember,
    removeMember,
    getGroupData,
    getMembers,
    isFollowingGroup,
    isMember,
    getGroups,
    ifUserExists,
    invite,
    createChat,
    getGroupPosts,
    getGroupPreview,
    getPostByID,
    followGroup,
    unfollowGroup,
    sign,
    like,
    ifGroupExists,
    createEvent,
};

export default ecclesia;
