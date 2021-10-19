import ecclesia from './index.js';
import axios from 'axios'
import privateKey from './src/devKey.js'
import rs from 'jsrsasign'
import fs from 'fs'
import aes from 'aes256'


const test = async () => {
    //console.log(await ecclesia.createAccount('luke', 'Ecclesia1'))
    //let photoData = fs.readFileSync('./headshot.jpg')
    //photoData = photoData.toString('base64')
    //console.log(await ecclesia.changePFP(photoData, privateKey, 'brennan'))
    //console.log(await ecclesia.createThinkpiece('Yuh', 'yuh', [photoData], privateKey, 'brennan'))
    //console.log(await ecclesia.login('brennan', 'Ecclesia1'))
    //console.log(await ecclesia.changeNameAndBio('Brennan Lamey', 'Founder', privateKey, 'brennan'))
    //console.log(await ecclesia.follow('brennan', 'luke', privateKey))
    //console.log(await ecclesia.ifUserExists('brennan'))
    //console.log(await ecclesia.createGroup('ecclesia', false, 'test group!', [], '', [], '#148FA0', 'brennan', privateKey)) 
    console.log(await ecclesia.getGroupData('ecclesia'))
};
test()


