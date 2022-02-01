import createAccount from './src/keyEncrypt/createAccount.js';
import changeNameAndBio from './src/account/changeNameAndBio.js';
import getFollowers from './src/account/getFollowers.js';
import changePFP from './src/account/changePFP.js';
import follow from './src/account/follow.js';
import getFullAccountData from './src/account/getFullAccountData.js';
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
import getGroupPosts from './src/groups/getGroupPosts.js';
import getGroupPreview from './src/groups/getGroupPreview.js';
import getPostByID from './src/posting/getPostByID.js';
import followGroup from './src/groups/followGroup.js';
import unfollowGroup from './src/groups/unfollowGroup.js';
import sign from './src/internal/sign.js';
import like from './src/interactions/like.js';
import unlike from './src/interactions/unlike.js';
import ifGroupExists from './src/groups/ifGroupExists.js';
import createEvent from './src/groups/createEvent.js';
import getNameAndBio from './src/account/getNameAndBio.js';
import getPublicJWKFromPrivateJWK from './src/internal/getPublicJWKFromPrivateJWK.js';
import generateSalt from './src/internal/generateSalt.js';
import sha384 from './src/internal/sha384.js';
import sendMessage from './src/messaging/temp/sendMessage.js';
import getMessages from './src/messaging/temp/getMessages.js';
import getPhotoURL from './src/internal/getPhotoURL.js';
import changeBanner from './src/account/changeBanner.js';
import getPostStats from './src/interactions/getPostStats.js'
import countLikes from './src/interactions/countLikes.js'
import getFeedGroupsOnly from './src/posting/getFeedGroupsOnly.js'
import getFeedUsersOnly from './src/posting/getFeedUsersOnly.js'
import changeAllAccountData from './src/account/changeAllAccountData.js'
import getGroupFollowers from './src/groups/getGroupFollowers.js'
import searchUsers from './src/account/searchUsers.js'
import searchGroups from './src/groups/searchGroups.js'
import editRules from './src/groups/editRules.js'
import isHolder from './src/web3/isHolder.js'
import getSalt from './src/account/getSalt.js'
import {setGateway, getGateway, setMoat} from './src/gateway.js'


const ecclesia = {
    createAccount,
    changeNameAndBio,
    getNameAndBio,
    changePFP,
    follow,
    getAccountData,
    getFollowing,
    isFollowing,
    getFullAccountData,
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
    getGroupPosts,
    getGroupPreview,
    getPostByID,
    followGroup,
    unfollowGroup,
    sign,
    like,
    ifGroupExists,
    createEvent,
    getPublicJWKFromPrivateJWK,
    generateSalt,
    sha384,
    sendMessage,
    getPhotoURL,
    unlike,
    getFollowers,
    changeBanner,
    getPostStats,
    countLikes,
    getFeedGroupsOnly,
    getFeedUsersOnly,
    changeAllAccountData,
    getGroupFollowers,
    searchUsers,
    searchGroups,
    editRules,
    isHolder,
    getSalt,
    setGateway,
    getGateway,
    setMoat
};

export default ecclesia;
