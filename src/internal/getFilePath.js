import gateway from '../gateway.js'

const getFilePath = () => {
    return gateway
    if (gateway == 'https://civic-wharf-335914.wl.r.appspot.com') {
        return 'https://storage.googleapis.com/kwilfiles'
    } else {
        return gateway
    }
}

export default getFilePath