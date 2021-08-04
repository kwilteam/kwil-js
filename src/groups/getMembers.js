import axios from 'axios'
import gateway from '../gateway.js'
import getFirstCharacter from '../internal/getFirstCharacter.js'
import checkSignator from '../internal/checkSignator.js'

const getMembers = async (_groupName) => {
    let firstChar = getFirstCharacter(_groupName)
    let _url = gateway + '/groups/' + firstChar + '/' + _groupName.toUpperCase() + '/members'
    const params = {
        url: _url,
        method: 'get',
        timeout: 20000
      }
      let response = await axios(params)
      if (checkSignator(response.data.data, response.data.signature)){
          return response.data.data.members
      }
}

export default getMembers