import axios from 'axios'
import gateway from '../gateway.js'
import checkSignature from '../internal/checkSignature.js'
import getFirstCharacter from '../internal/getFirstCharacter.js'
import getNameAndBio from './getNameAndBio.js'
import getPFP from './getPFP.js'

const getAccountData = async (_username) => {
  const accountData = await getNameAndBio(_username)
  const pfp = await getPFP(_username)
  return {username: accountData.username, name: accountData.name, bio: accountData.bio, pfp: pfp.pfp}
}



export default getAccountData
/*const testFunc = async () => {
console.log(await getAccountData('Brennanjl2'))
}
testFunc()*/