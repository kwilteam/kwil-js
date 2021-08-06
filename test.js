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

const test = async () => {
    console.log(await createAccount('Bill', 'Ecclesia1'))
    //console.log(await getThoughts('bigbutt2', 0))
    //console.log(await getAccountData('brennanjl'))
    //console.log(await getPosts('brennan',0))
    //await comment("Dan is an acronym for Daddy's Ape Nuts", 'f64681a683c31b9762a2f70187e1bebb33839bf45265329a39f47a95363ca837', privateKey, 'Brennanjl')
    //console.log(await getComments('16ea6209a305766fd7c1b8c81168be6c49e549ba92755d3b33532c3d20f2bb26', 0))
    //sendMessage('Hi 3!', 'bigbutt2', 'Brennanjl', privateKey)
    //getInbox('Brennanjl')
    //console.log(await getMessages('Brennanjl', privateKey))
    //console.log(await getAccountData('test1'))
    //console.log(await createGroup('Ecclesia', false, 'Brennanjl', privateKey))
    //console.log(await getGroupData('Ecclesia'))
    //console.log(await editGroup('Ecclesia', 'Ecclesia description!', ['Yuh!'], '', ['www.google.com'], 'brennanjl', privateKey))
    //console.log(await comment('This post sucks', '16ea6209a305766fd7c1b8c81168be6c49e549ba92755d3b33532c3d20f2bb26', privateKey, 'brennanjl'))
    //console.log(await getMembers('Ecclesia'))
    //console.log(await addMember('Ecclesia', 'Thomas', 'Brennanjl', privateKey))
    //console.log(await removeMember('Ecclesia', 'Thomas', 'Brennanjl', privateKey))
}
test()