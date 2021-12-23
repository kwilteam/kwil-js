import ecclesia from './index.js';
import { bruhjwk, bruh3jwk, rjwk, ljwk } from './src/devKey.js'
import fs from 'fs'
import getAccountData from './src/account/getAccountData.js';
import ifGroupExists from './src/groups/ifGroupExists.js';
import getFollowing from './src/account/getFollowing.js';
import sha384 from './src/internal/sha384.js';


const test = async () => {
    //let photoData = fs.readFileSync('./headshot.jpg')
    //photoData = photoData.toString('base64')
    //console.log(await ecclesia.createAccount('brennanjl334', 'Ecclesia1'))
    //console.log(await ecclesia.login('brennanjl222', 'Ecclesia1'))
    //console.log(await ecclesia.ifUserExists('brennanjl1209'))
    //console.log(await ecclesia.getFeed('brennanjl1209'))

    //console.log(await ecclesia.changeAllAccountData('Brennan Lamey', 'Founder of Kwil!', null, '', ljwk, 'brennanjl222'))
    //console.log(await ecclesia.changeAllAccountData('Brennan Lamey', 'Founder of Kwil!', '', photoData, ljwk, 'brennanjl222'))

    //console.log(await ecclesia.login('brennanjl', 'Ecclesia1'))
    //console.log(await ecclesia.getAccountData('brennanjl222'))
    
    //console.log(await ecclesia.comment('Comment!', '9zld_RGCtAXIMIGFTmTqwkSBSjqw2sc3RNEymY_lLab81hefec51Lzgkfo7zWU8d', ljwk, 'brennanjl', 'post'))
    //console.log(await ecclesia.comment('Re-comment', '9zld_RGCtAXIMIGFTmTqwkSBSjqw2sc3RNEymY_lLab81hefec51Lzgkfo7zWU8d', ljwk, 'brennanjl', 'comment'))
    //console.log(await ecclesia.changeBanner(photoData, bruhjwk, 'brennanjl1'))
    //console.log(await ecclesia.createThought('Test post group!', '', ljwk, 'brennanjl222'))
    //console.log(await ecclesia.changePFP(photoData, privateKey, 'brennan'))
    //console.log(await ecclesia.createThinkpiece('Yuh', 'yuh', [''], privateKey, 'brennan'))
    //console.log(await ecclesia.login('brennan', 'Ecclesia1'))
    //console.log(await ecclesia.changeAllAccountData('Brennan Lamey', 'Founder of Kwil!', photoData, photoData, ljwk, 'brennanjl'))
    //console.log(await ecclesia.unfollow('brennanjl', 'brennanjl3', ljwk))
    //console.log(await ecclesia.ifUserExists('test1'))
    //console.log(await ecclesia.createGroup('testgroup1', false, 'test!', ['tag1', 'tag2'], '', photoData, '', [], '', 'brennanjl222', ljwk))
    //console.log(await ecclesia.getAccountData('brennanjl1'))
    //console.log(await ecclesia.editGroup('testgroup1', false, 'Test image!', ['tag1', 'tag2', 'tag3'],'', '', photoData, '', '', 'brennanjl222', ljwk))
    //console.log(await ecclesia.addMember('testgroup', 'brennanjl3', 'brennanjl', ljwk))
    //console.log(await ecclesia.getGroupData('testgroup1'))
    //console.log(await ecclesia.followGroup('testgroup', 'brennanjl', ljwk))
    //console.log(await ecclesia.getGroupPosts('test_group'))
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
    //console.log(await ecclesia.like(true, '9zld_RGCtAXIMIGFTmTqwkSBSjqw2sc3RNEymY_lLab81hefec51Lzgkfo7zWU8d', 'brennanjl', ljwk))
    //console.log(await ecclesia.unlike('9zld_RGCtAXIMIGFTmTqwkSBSjqw2sc3RNEymY_lLab81hefec51Lzgkfo7zWU8d', 'brennanjl', ljwk))
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
    //console.log(await ecclesia.searchUsers('Moop'))
    //console.log(await ecclesia.ifUserExists('test1'))
    //console.log(await ecclesia.editRules([], 'testgroup', 'brennanjl1', ljwk))
};
//test();
