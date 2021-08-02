import getAccountData from './src/account/getAccountData.js'
import getPosts from './src/posting/getPosts.js'
import createAccount from './src/keyEncrypt/createAccount.js'
import getFeed from './src/posting/getFeed.js'
import getThinkpieces from './src/posting/getThinkpieces.js'
import getThoughts from './src/posting/getThoughts.js'
import comment from './src/posting/comment.js'
import privateKey from './src/devKey.js'
import getComments from './src/posting/getComments.js'
import sendMessage from './src/messaging/sendMessage.js'
import getInbox from './src/messaging/getInbox.js'
import rs from 'jsrsasign'
import getMessages from './src/messaging/getMessages.js'

const test = async () => {
    //console.log(await getThoughts('TEST1', 0))
    //console.log(await createAccount('Brennanjl2', 'Ecclesia1'))
    //console.log(await getThoughts('bigbutt2', 0))
    //console.log(await getAccountData('brennanjl'))
    //console.log(await getPosts('bigbutt2',0))
    //await comment("Dan is an acronym for Daddy's Ape Nuts", 'f64681a683c31b9762a2f70187e1bebb33839bf45265329a39f47a95363ca837', privateKey, 'Brennanjl')
    //console.log(await getComments('f64681a683c31b9762a2f70187e1bebb33839bf45265329a39f47a95363ca837', 0))
    //sendMessage('Hi 3!', 'bigbutt2', 'Brennanjl', privateKey)
    //getInbox('Brennanjl')
    //console.log(await getMessages('Brennanjl', privateKey))
    console.log(await getAccountData('test1'))
}
test()