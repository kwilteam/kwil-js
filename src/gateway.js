import axios from 'axios'
//const gateway = 'https://ecclesia.ngrok.io'; //This is for production
//const gateway = 'https://e0a0-104-32-150-47.ngrok.io' //This is for dev
//const gateway = 'http://localhost:8443' //This is for when I'm on a plane

//const gateway = 'https://kwildemo.ngrok.io';
//const gateway = 'http://localhost:8443'
//const gateway = 'https://nidhi.ngrok.io'
//const gateway = 'https://civic-wharf-335914.wl.r.appspot.com'
let gateway = 'https://demo.kwil.xyz'
let moat = 'demo'
//let gateway = 'https://tacen.kwil.xyz:8443'//'https://nidhi.ngrok.io'
async function getGateway (_url) {
    const params = {
        url: `https://urls.kwil.xyz/${_url}/gateway`,
        method: 'get',
        timeout: 20000,
    }
    const response = await axios(params)

    return response.data
}
function setGateway (_url) {
    gateway = _url
}

function setMoat (_moat) {
    moat = _moat
}
export {gateway,moat, setMoat, setGateway, getGateway};
