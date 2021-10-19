import gateway from '../../gateway.js'
import axios from 'axios'

const getMessages = async (_username) => {
    const _url = gateway + '/'+_username.toLowerCase()+ `/getMessages`;
    const params = {
        url: _url,
        method: 'get',
        timeout: 20000,
        headers: { 'Content-Type': 'application/json' }
    }
    let response = await axios(params)
    response = response.data

    const correspondents = {}
    for (let i=0; i<response.length; i++) {
        if(!correspondents.hasOwnProperty(response[i].sender) && response[i].sender !== _username) {
            correspondents[response[i].sender] = []
        }
        if(!correspondents.hasOwnProperty(response[i].receiver) && response[i].receiver !== _username) {
            correspondents[response[i].receiver] = []
        }
    }

    /*correspondents.forEach(function (corr) {
        for (let i=0; i<response.length; i++) {
            if (response[i].sender == corr || response[i].receiver == corr) {
                corr.push(response[i])
            }
        }
    })*/

    for (let corr in correspondents) {
        for (let i=0; i<response.length; i++) {
            if (response[i].sender == corr || response[i].receiver == corr) {
                correspondents[corr].push(response[i])
            }
        }
    }

    /*function compare(a,b) {
        let c = ''
        let d = ''
        if (a.sender !== _username) {
            c = a.sender
        } else {
            c = a.receiver
        }
        if (b.sender !== _username) {
            d = b.sender
        } else {
            d = b.receiver
        }
        let comp = 0
        if (c > d) {
            comp = 1
        } else if(c<d){
            comp = -1
        }
        return comp
    }

    const sortedMessages = response.data.sort(compare)

    /*for (let i=0; i<sortedMessages.length; i++) {
        if(!correspondents.hasOwnProperty(sortedMessages[i].sender) && sortedMessages[i].sender !== _username) {
            correspondents[response[i].sender]
        }
    }*/

    return correspondents

}

export default getMessages