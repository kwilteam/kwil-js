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
    getThoughts
}

export default ecclesia