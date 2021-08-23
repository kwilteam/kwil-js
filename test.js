import getAccountData from './src/account/getAccountData.js'
import getPosts from './src/posting/getPosts.js'
import createAccount from './src/keyEncrypt/createAccount.js'
import getFeed from './src/posting/getFeed.js'
import getThinkpieces from './src/posting/getThinkpieces.js'
import getThoughts from './src/posting/getThoughts.js'
import comment from './src/posting/comment.js'
import privateKey from './src/devKey.js'
import getComments from './src/posting/getComments.js'
import sendMessage from './src/messaging/common/sendMessage.js'
import getInbox from './src/messaging/getInbox.js'
import rs from 'jsrsasign'
import getMessages from './src/messaging/getMessages.js'
import createGroup from './src/groups/createGroup.js'
import getGroupData from './src/groups/getGroupData.js'
import editGroup from './src/groups/editGroup.js'
import getMembers from './src/groups/getMembers.js'
import addMember from './src/groups/addMember.js'
import removeMember from './src/groups/removeMember.js'
import isFollowing from './src/account/isFollowing.js'
import createChat from './src/messaging/chats/createChat.js'
import createThought from './src/posting/createThought.js'
import login from './src/keyEncrypt/login.js'
import followGroup from './src/groups/followGroup.js'
import getFollowing from './src/account/getFollowing.js'
import getFollowingData from './src/internal/getFollowingData.js'
import unfollowGroup from './src/groups/unfollowGroup.js'
import invite from './src/messaging/chats/invite.js'
import createThinkpiece from './src/posting/createThinkpiece.js'
import ecclesia from './index.js'
import {Post} from './src/classes.js'

const test = async () => {
    //console.log(await createAccount('Brennan', 'Ecclesia1'))
    //console.log(await followGroup('Ecclesia', 'Brennan', privateKey))
    //console.log(await unfollowGroup('Ecclesia', 'Brennan', privateKey))
    //console.log(await getFollowingData('Brennan'))
    //console.log(await getThoughts('brennan', 0))
    //console.log(await login('brennan', 'Ecclesia1'))
    //console.log(await getAccountData('brennanjl'))
    //console.log(await getPosts('brennan',0))
    //await comment("Dan is an acronym for Daddy's Ape Nuts", 'f64681a683c31b9762a2f70187e1bebb33839bf45265329a39f47a95363ca837', privateKey, 'Brennanjl')
    //console.log(await getComments('16ea6209a305766fd7c1b8c81168be6c49e549ba92755d3b33532c3d20f2bb26', 0))
    //sendMessage('Hi 3!', 'bigbutt2', 'Brennanjl', privateKey)
    //getInbox('Brennanjl')
    //console.log(await getMessages('Brennanjl', privateKey))
    //console.log(await getAccountData('test1'))
    //console.log(await createGroup('Ecclesia', true, 'Ecclesia group', '', '', '', 'Brennan', privateKey))
    //console.log(await getGroupData('Ecclesia'))
    //console.log(await editGroup('Ecclesia', 'Ecclesia description!', '',['Yuh!'], '', ['www.google.com'], 'brennan', privateKey))
    //console.log(await comment('This post sucks', '16ea6209a305766fd7c1b8c81168be6c49e549ba92755d3b33532c3d20f2bb26', privateKey, 'brennanjl'))
    //console.log(await getMembers('Ecclesia'))
    //console.log(await addMember('Ecclesia', 'Thomas', 'Brennanjl', privateKey))
    //console.log(await removeMember('Ecclesia', 'Thomas', 'Brennanjl', privateKey))
    //await createChat(['test3'], 'Brennan', 'Ecclesia1', privateKey)
    //await invite('hi', 'brennan', 'test3', privateKey)
    //console.log(await getGroupData('test'))
    //console.log(await createThought('Hi!', '', privateKey, 'Brennan'))
    //console.log(await getFeed('Brennan', 0))
    //console.log(await createThinkpiece('yuh', 'yuh', '', privateKey, 'brennan', 'Ecclesia'))
    //console.log(await ecclesia.ifUserExists('brennan'))
    //console.log(ecclesia.invite('hi!', 'brennan', 'bob', privateKey))
    //console.log(ecclesia.createChat(['bob'], 'brennan', 'Ecclesia1', privateKey))
    //console.log(await ecclesia.getGroupPosts('testgroup', 0))
    //console.log(await ecclesia.createThinkpiece('hi','Hi!', [], privateKey, 'brennan'))
    //console.log(await ecclesia.getPostByID('578923a40149e990de5030d6d8842270fdef69f8f65f3ce1fe7df446f566e2de', 'BIGBUTT2', 'thought'))
}

test()



/*
let pKey = rs.KEYUTIL.getKey(privateKey)
let yuh = rs.KEYUTIL.getPEM(pKey, 'PKCS5PRV', 'password')
//yuh = rs.KEYUTIL._getPlainPKCS8HexFromEncryptedPKCS8PEM(yuh, 'password')
//console.log(rs.KEYUTIL.parseHexOfEncryptedPKCS8('password'))
//yuh = rs.KEYUTIL.getPBKDF2KeyHexFromParam(yuh, 'password')
console.log(yuh)*/