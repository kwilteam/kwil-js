import createAccount from './src/keyEncrypt/createAccount.js'
import changeNameAndBio from './src/account/changeNameAndBio.js'
import changePFP from './src/account/changePFP.js'
import follow from './src/account/follow.js'
import getAccountData from './src/account/getAccountData.js'
import getFollowing from './src/account/getFollowing.js'
import isFollowing from './src/account/isFollowing.js'
import unfollow from './src/account/unfollow.js'
import login from './src/keyEncrypt/login.js'
import comment from './src/posting/comment.js'
import createThinkpiece from './src/posting/createThinkpiece.js'
import createThought from './src/posting/createThought.js'
import getComments from './src/posting/getComments.js'
import getFeed from './src/posting/getFeed.js'
import getPosts from './src/posting/getPosts.js'
import getThinkpieces from './src/posting/getThinkpieces.js'
import getThoughts from './src/posting/getThoughts.js'
import decryptMessage from './src/messaging/decryptMessage.js'
import getInbox from './src/messaging/getInbox.js'
import getMessages from './src/messaging/getMessages.js'
import sendMessage from './src/messaging/common/sendMessage.js'
import changeAllData from './src/account/changeAllData.js'
import createGroup from './src/groups/createGroup.js'
import editGroup from './src/groups/editGroup.js'
import addMember from './src/groups/addMember.js'
import removeMember from './src/groups/removeMember.js'
import getGroupData from './src/groups/getGroupData.js'
import getMembers from './src/groups/getMembers.js'


const ecclesia = {
    createAccount,
    changeNameAndBio,
    changePFP,
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
    changeAllData,
    createGroup,
    editGroup,
    addMember,
    removeMember,
    getGroupData,
    getMembers
}

export default ecclesia