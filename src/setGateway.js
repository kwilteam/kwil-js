//This is a temporary work around to be able to set the gateway variable
let gateway
function setGateway (_url) {
    gateway = _url
}

export {gateway, setGateway}