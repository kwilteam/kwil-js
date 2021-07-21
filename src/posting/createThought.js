import NodeRSA from 'node-rsa'

const createThought = async (_postText, _img, _privateKey) => {
    const falseKey = await new NodeRSA();
    const key = falseKey.importKey()
    let untrimmedPublicKey = key.exportKey('pkcs8-public-pem')
    let untrimmedPublicKey2 = untrimmedPublicKey.replace('-----BEGIN PUBLIC KEY-----\n', '')
    let publicKey = untrimmedPublicKey2.replace('\n-----END PUBLIC KEY-----', '')
    let postData = {"data":{
                        "postText": _postText,
                        "postPhoto": _img,
                        "publicKey": 
                            },
                    "signature": ,
                    "ID": ,
                    "username": }
}