//const gateway = 'https://ecclesia.ngrok.io'; //This is for production
//const gateway = 'https://e0a0-104-32-150-47.ngrok.io' //This is for dev
//const gateway = 'http://localhost:4000' //This is for when I'm on a plane

//const gateway = 'https://kwildemo.ngrok.io';
//const gateway = 'http://localhost:8080'
//const gateway = 'https://nidhi.ngrok.io'
//const gateway = 'https://civic-wharf-335914.wl.r.appspot.com'
//const gateway = 'https://35.236.113.214:8080'
let gateway
function setGateway (_url) {
    gateway = _url
}
export {gateway, setGateway};
