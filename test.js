import ecclesia from './index.js';
import { bruhjwk, bruh3jwk, rjwk } from './src/devKey.js'
import fs from 'fs'
import getAccountData from './src/account/getAccountData.js';
import ifGroupExists from './src/groups/ifGroupExists.js';
import getFollowing from './src/account/getFollowing.js';

const test = async () => {
    //console.log(await ecclesia.createAccount('brennanjl3', 'Ecclesia1'))
    //console.log(await ecclesia.login('test1', 'TestAccount1'))
    //console.log(await ecclesia.login('brennanjl', 'Ecclesia1'))
    //console.log(await ecclesia.getAccountData('brennan'))
    //let photoData = fs.readFileSync('./headshot.jpg')
    //photoData = photoData.toString('base64')
    //console.log(await ecclesia.comment('Comment!', '171E0SdMmlLi38wEaTTAh-sDGDUZhKN7fgQvHIVfrVW3ZShQ9QidFBhkVnellGHM', bruhjwk, 'brennanjl1', 'post'))
    //console.log(await ecclesia.changeBanner(photoData, bruhjwk, 'brennanjl1'))
    //console.log(await ecclesia.createThought('Test post with justin!', '', bruhjwk, 'brennanjl1'))
    //console.log(await ecclesia.changePFP(photoData, privateKey, 'brennan'))
    //console.log(await ecclesia.createThinkpiece('Yuh', 'yuh', [''], privateKey, 'brennan'))
    //console.log(await ecclesia.login('brennan', 'Ecclesia1'))
    //console.log(await ecclesia.changeNameAndBio('Brennan Lamey', 'Founder', privateKey, 'brennan'))
    //console.log(await ecclesia.follow('brennanjl1', 'brennanjl', privateKey))
    //console.log(await ecclesia.ifUserExists('brennan'))
    //console.log(await ecclesia.createGroup('ecclesia12', false, 'test!', ['tag1', 'tag2'], photoData, '', [], '#148FA0', 'brennanjl1', bruhjwk))
    //console.log(await ecclesia.getAccountData('brennanjl1'))
    //console.log(await ecclesia.editGroup('ecclesia123', false, 'Test image!', ['tag1', 'tag2', 'tag3'], photoData, '', '#148FA0', 'brennanjl10', privateKey))
    //console.log(await ecclesia.addMember('ecclesia', 'brennanjl', 'brennanjl1', privateKey))
    //console.log(await ecclesia.followGroup('ecclesia', 'brennan', privateKey))
    //console.log(await ecclesia.getGroupPosts('ECCLESIA'))
    //console.log(await ecclesia.getPosts('brennanjl1', new Date, 20))
    //console.log(await ecclesia.getFeed('brennanjl10', new Date('Mon Nov 15 2021 13:28:14 GMT-0800 (Pacific Standard Time)')))
    //console.log(await ecclesia.getGroupPreview('ECCLESIA123'))
    //console.log(await ecclesia.getGroups('brennanjl1'))
    //console.log(await ecclesia.isFollowingGroup('brennan','ecclesia'))
    //console.log(await ecclesia.getThoughts('brennanjl1', new Date, 20))
    //console.log(await ecclesia.getComments('f3mkf3', 'thought'))
    //console.log(await ecclesia.getPostByID('oC/QxhSHdX04CT0LgXG0z6150dDT8U7NSaKy6DEvtonCXsFNLMfaJB5p6LiWOwMR'))
    //console.log(ecclesia.getPhotoURL('9220607886134fc25f2b10b2663c2cf9d4f15aa8'))
    //console.log(await ecclesia.getAccountData('test1'))
    //console.log(await ecclesia.like(true, 'f4e3w', 'brennanjl', privateKey))
    //console.log(await ecclesia.unlike('f4e3w', 'brennanjl', privateKey))
    //console.log(await ecclesia.getFollowers('test1'))
    //console.log(await ecclesia.getAccountData('brennan'))
    //console.log(await getAccountData('hellofresh'))
    //console.log(await ecclesia.getPostStats('171E0SdMmlLi38wEaTTAh-sDGDUZhKN7fgQvHIVfrVW3ZShQ9QidFBhkVnellGHM', 'brennanjl11'))
    //console.log(await ecclesia.countLikes('171E0SdMmlLi38wEaTTAh-sDGDUZhKN7fgQvHIVfrVW3ZShQ9QidFBhkVnellGHM'))
    //await ecclesia.like(false, '171E0SdMmlLi38wEaTTAh-sDGDUZhKN7fgQvHIVfrVW3ZShQ9QidFBhkVnellGHM', 'brennanjl3', bruh3jwk)
    //171E0SdMmlLi38wEaTTAh-sDGDUZhKN7fgQvHIVfrVW3ZShQ9QidFBhkVnellGHM
    //console.log(await ecclesia.getGroups('brennanjl1'))
    //console.log(await ecclesia.follow('brennanjl1', 'test1', bruhjwk))
    //console.log(await ecclesia.getFeedGroupsOnly('brennanjl1'))
    //console.log(await ecclesia.getFeedUsersOnly('brennanjl1'))
    //console.log(await ecclesia.changeAllAccountData('Brennan', 'Brennans account', '', '', bruhjwk, 'brennanjl1'))\
    //console.log(await ecclesia.getGroupFollowers('ecclesia123'))
};
test();
