import ecclesia from './index.js';
import axios from 'axios';
import privateKey from './src/devKey.js';
import rs from 'jsrsasign';
import fs from 'fs';
import aes2 from 'react-native-crypto-js'
import sign from './src/internal/sign.js';
import generateSalt from './src/internal/generateSalt.js';
import generateKeyPair from './src/keyEncrypt/generateKeyPair.js';
import scrypt from 'scrypt-js'

const test = async () => {
    //console.log(await ecclesia.createAccount('brennan', 'Ecclesia1'))
    //console.log(await ecclesia.login('test1', 'TestAccount1'))
    //console.log(await ecclesia.login('brennanjl', 'Ecclesia1'))
    //console.log(await ecclesia.getAccountData('brennan'))
    //let photoData = fs.readFileSync('./headshot.jpg')
    //photoData = photoData.toString('base64')
    //console.log(await ecclesia.createThought('Test post!', '', privateKey, 'brennanjl10'))
    //console.log(await ecclesia.changePFP(photoData, privateKey, 'brennan'))
    //console.log(await ecclesia.createThinkpiece('Yuh', 'yuh', [''], privateKey, 'brennan'))
    //console.log(await ecclesia.login('brennan', 'Ecclesia1'))
    //console.log(await ecclesia.changeNameAndBio('Brennan Lamey', 'Founder', privateKey, 'brennan'))
    //console.log(await ecclesia.follow('brennanjl1', 'brennanjl', privateKey))
    //console.log(await ecclesia.ifUserExists('brennan'))
    //console.log(await ecclesia.createGroup('ecclesia123', false, 'test!', ['tag1', 'tag2'], '', [], '#148FA0', 'brennanjl10', privateKey))
    //console.log(await ecclesia.getGroupData('ecclesia123'))
    //console.log(await ecclesia.editGroup('ecclesia123', false, 'Test image!', ['tag1', 'tag2', 'tag3'], photoData, '', '#148FA0', 'brennanjl10', privateKey))
    //console.log(await ecclesia.addMember('ecclesia', 'brennanjl', 'brennanjl1', privateKey))
    //console.log(await ecclesia.followGroup('ecclesia', 'brennan', privateKey))
    //console.log(await ecclesia.getGroupPosts('ECCLESIA'))
    //console.log(await ecclesia.getPosts('brennanjl10'))
    //console.log(await ecclesia.getFeed('brennanjl10', new Date('Mon Nov 15 2021 13:28:14 GMT-0800 (Pacific Standard Time)')))
    //console.log(await ecclesia.getGroupPreview('ECCLESIA123'))
    //console.log(await ecclesia.getGroups('brennanjl1'))
    //console.log(await ecclesia.isFollowingGroup('brennan','ecclesia'))
    //console.log(await ecclesia.getThoughts('brennan'))
    //console.log(await ecclesia.getComments('f3mkf3', 'thought'))
    //console.log(await ecclesia.getPostByID('oC/QxhSHdX04CT0LgXG0z6150dDT8U7NSaKy6DEvtonCXsFNLMfaJB5p6LiWOwMR'))
    //console.log(ecclesia.getPhotoURL('9220607886134fc25f2b10b2663c2cf9d4f15aa8'))
    //console.log(await ecclesia.getAccountData('test1'))
    //console.log(await ecclesia.like(true, 'f4e3w', 'brennanjl', privateKey))
    //console.log(await ecclesia.unlike('f4e3w', 'brennanjl', privateKey))
    //console.log(await ecclesia.getFollowers('test1'))
    //console.log(await ecclesia.follow('brennanjl', 'test1', privateKey))
};
test();
