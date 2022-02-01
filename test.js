import ecclesia from './index.js';
import { bruhjwk, bruh3jwk, rjwk, ljwk, bjwk } from './src/devKey.js'
import fs from 'fs'
import getAccountData from './src/account/getAccountData.js';
import ifGroupExists from './src/groups/ifGroupExists.js';
import getFollowing from './src/account/getFollowing.js';
import sha384 from './src/internal/sha384.js';
import axios from 'axios';
import {gateway, setGateway, getGateway} from './src/gateway.js'
import getPosts from './src/posting/getPosts.js';

const test = async () => {
    //let photoData = fs.readFileSync('./headshot.jpg')
    //photoData = photoData.toString('base64')
    //console.log(await ecclesia.createAccount('kwil11', 'Ecclesia1'))
    //console.log(await ecclesia.login('kwil', 'Ecclesia1'))
    //console.time('yuh')
    //console.log(await ecclesia.getPosts('kwil'))
    //console.log(response)
    //console.log(response)
    //console.log(await ecclesia.getAccountData('brennanjl2222'))
    //console.log(await ecclesia.ifUserExists('hellobud'))
    //console.log(await ecclesia.isHolder('0xEF94BD30AA33de1677D7614D17aA39D493a485F1', '0xbfcd68ded9d511a632d45333155350a1907d4977'))
    //console.log(await ecclesia.getSalt('brennanjl2222'))
    //console.log(await ecclesia.ifUserExists('brennanjl1e2'))
    //console.timeEnd('yuh')
    //console.log(await ecclesia.getAccountData('kwil10'))
    //console.log(await ecclesia.getFeed('brennanjl'))
    //console.log(await ecclesia.getPosts('brennanjl123'))

    //console.log(await ecclesia.changeAllAccountData('Brennan Lamey', 'Founder of Kwil!', null, '', ljwk, 'brennanjl222'))
    //console.log(await ecclesia.changeAllAccountData('Brennan Lamey', 'Founder of Kwil!', photoData, null, ljwk, 'kwil10'))

    //console.log(await ecclesia.login('brennanjl123', 'Ecclesia1'))
    //console.log(await ecclesia.getAccountData('brennanjl123'))
    //console.log(await ecclesia.getFeed('kwil'))
    //console.log(await ecclesia.comment('Comment!', '9zld_RGCtAXIMIGFTmTqwkSBSjqw2sc3RNEymY_lLab81hefec51Lzgkfo7zWU8d', ljwk, 'brennanjl123', 'post'))
    //console.log(await ecclesia.comment('Re-comment', '9zld_RGCtAXIMIGFTmTqwkSBSjqw2sc3RNEymY_lLab81hefec51Lzgkfo7zWU8d', ljwk, 'brennanjl', 'comment'))
    //console.log(await ecclesia.changeBanner(photoData, ljwk, 'brennanjl123'))
    //console.log(await ecclesia.createThought('Test post BREAK DA BUNDLE PT 3!!', '', ljwk, 'kwil1'))
    //console.log(await ecclesia.changePFP(photoData, privateKey, 'brennan'))
    //console.log(await ecclesia.createThinkpiece('Yuh', 'yuh', [''], privateKey, 'brennan'))
    //console.log(await ecclesia.login('brennan', 'Ecclesia1'))
    //console.log(await ecclesia.changeAllAccountData('Brennan Lamey', 'Founder of Kwil!', photoData, photoData, ljwk, 'brennanjl'))
    //console.log(await ecclesia.follow('brennanjl123', 'test1', ljwk))
    //console.log(await ecclesia.ifUserExists('test1'))
    //console.log(await ecclesia.createGroup('testgroup1', false, 'test!', ['tag1', 'tag2'], '', '', '', [], '', 'brennan', bjwk))
    //console.log(await ecclesia.getAccountData('brennanjl1'))
    //console.log(await ecclesia.editGroup('testgroup1', false, 'Test image!', ['tag1', 'tag2', 'tag3'],'', '', photoData, '', '', 'kwil1', ljwk))
    //console.log(await ecclesia.addMember('testgroup1', 'brennanjl3', 'kwil1', ljwk))
    //console.log(await ecclesia.unlike('f43f3', 'kwil1', ljwk))
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
    //console.log(await getAccountData('hellofresh'))
    //console.log(await ecclesia.getPostStats('171E0SdMmlLi38wEaTTAh-sDGDUZhKN7fgQvHIVfrVW3ZShQ9QidFBhkVnellGHM', 'brennanjl11'))
    //console.log(await ecclesia.countLikes('171E0SdMmlLi38wEaTTAh-sDGDUZhKN7fgQvHIVfrVW3ZShQ9QidFBhkVnellGHM'))
    //await ecclesia.like(false, '171E0SdMmlLi38wEaTTAh-sDGDUZhKN7fgQvHIVfrVW3ZShQ9QidFBhkVnellGHM', 'brennanjl3', bruh3jwk)
    //171E0SdMmlLi38wEaTTAh-sDGDUZhKN7fgQvHIVfrVW3ZShQ9QidFBhkVnellGHM
    //console.log(await ecclesia.getGroups('brennanjl1'))
    //console.log(await ecclesia.follow('brennanjl1', 'test1', bruhjwk))
    //console.log(await ecclesia.getFeed('brennanjl2222'))
    //console.log(await ecclesia.getFeedGroupsOnly('brennanjl'))
    //console.log(await ecclesia.getFeed('ghghghg'))
    //console.log(await ecclesia.getFeedGroupsOnly('kwil1'))
    //console.log(await ecclesia.getGroupPosts('testg'))
    //console.log(await ecclesia.getFeed('kwil1'))
    //console.log(await ecclesia.getFeedUsersOnly('kwil1'))
    //console.log(await ecclesia.followGroup('testg', 'kwil1', ljwk))
    //console.log(await ecclesia.changeAllAccountData('Brennan', 'Brennans account', '', '', bruhjwk, 'brennanjl1'))\
    //console.log(await ecclesia.getGroupFollowers('ecclesia123'))
    //console.log(await ecclesia.searchUsers('Moop'))
    //console.log(await ecclesia.ifUserExists('ghgeehghg'))
    //console.log(await ecclesia.editRules([], 'testgroup', 'brennanjl1', ljwk))
    //console.log(await getGateway('https://demo.kwil.com'))
    //setGateway('https://nidhi.ngrok.io')
    //console.log(await getPosts('brennanjl123'))
    //console.log(await ecclesia.getGroupData('new_group'))
    console.log(await ecclesia.getThoughts('brennanjl'))
};


test();
