import ecclesia from './index.js';
import axios from 'axios';
import privateKey from './src/devKey.js';
import rs from 'jsrsasign';
import fs from 'fs';
import aes from 'aes256';

const test = async () => {
    //console.log(await ecclesia.createAccount('brennanjl', 'Ecclesia1'))
    //console.log(await ecclesia.login('brennan', 'Ecclesia1'))
    //console.log(await ecclesia.getAccountData('test1'))
    //let photoData = fs.readFileSync('./headshot.jpg')
    //photoData = photoData.toString('base64')
    //console.log(await ecclesia.createThought('Test post!', '', privateKey, 'brennan1', 'ecclesia'))
    //console.log(await ecclesia.changePFP(photoData, privateKey, 'brennan'))
    //console.log(await ecclesia.createThinkpiece('Yuh', 'yuh', [''], privateKey, 'brennan'))
    //console.log(await ecclesia.login('brennan', 'Ecclesia1'))
    //console.log(await ecclesia.changeNameAndBio('Brennan Lamey', 'Founder', privateKey, 'brennan'))
    //console.log(await ecclesia.follow('brennan', 'brennan1', privateKey))
    //console.log(await ecclesia.ifUserExists('brennan'))
    //console.log(await ecclesia.createGroup('ecclesia', false, 'test group2!', ['tag1', 'tag2'], '', [], '#148FA0', 'brennan', privateKey))
    //console.log(await ecclesia.getGroupData('ecclesia'))
    //console.log(await ecclesia.editGroup('ecclesia', 'Test description private!', true, ['tag1', 'tag2'], '', '', '#148FA0', 'brennan', privateKey))
    //console.log(await ecclesia.removeMember('ecclesia', 'luke', 'brennan', privateKey))
    //console.log(await ecclesia.followGroup('ecclesia', 'brennan', privateKey))
    //console.log(await ecclesia.getGroupPosts('ecclesia', 0, 20))
    //console.log(await ecclesia.getFeed('brennan'))
    //console.log(await ecclesia.getGroupPreview('ecclesia'))
    //console.log(await ecclesia.isFollowingGroup('brennan','ecclesia'))
    //console.log(await ecclesia.getThoughts('brennan'))
    //console.log(await ecclesia.getComments('f3mkf3', 'thought'))
    //console.log(await ecclesia.getPostByID('oC/QxhSHdX04CT0LgXG0z6150dDT8U7NSaKy6DEvtonCXsFNLMfaJB5p6LiWOwMR'))
    //console.log(ecclesia.getPhotoURL('9220607886134fc25f2b10b2663c2cf9d4f15aa8'))
    //console.log(await ecclesia.getAccountData('test1'))
};
test();
