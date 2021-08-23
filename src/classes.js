import {sha256} from 'js-sha256'
import rs from 'jsrsasign'
import sign from './internal/sign.js'
import getPublicJWKFromPrivateJWK from './internal/getPublicJWKFromPrivateJWK.js'

class Chat {
    constructor(_name) {
        this.name = _name
    }
}

class Post {
    constructor(_title, _text, _photo, _type, _referencing, _username, _groupTag, _privateJWK) {
        this.data = {
            postTitle: _title,
            postText: _text,
            postPhoto: _photo,
            publicKey: getPublicJWKFromPrivateJWK(_privateJWK),
            type: _type,
            timeStamp: Date.now(),
            referencing: _referencing,
            username: _username,
            groupTag: _groupTag
        }
        this.signature = sign(this.data, rs.KEYUTIL.getKey(_privateJWK))
        this.ID = sha256(this.signature+this.data.timeStamp)
    }
}

class Group {
    constructor(_groupName, _public, _description, _tags, _image, _links, _color, _creator, _charterSignature, _publicKey, _dataSignature, _members, _membersSignature) {
        //Groups must contain charter, data, and members
        this.charter = {
            data: {
                groupName: _groupName, 
                public: _public, 
                creator: _creator.toLowerCase(),
                publicKey: _publicKey,
                timeStamp: _timeStamp
            }, 
            signature: _charterSignature
        }
        this.data = {
            data: {
                owner: _creator.toLowerCase(),
                public: _public,
                description: _description,
                tags: _tags,
                image: _image,
                links: _links,
                color: _color,
                signator: {
                    username: _creator.toLowerCase(),
                    publicKey: _publicKey
                }
            },
            signature: _dataSignature
        }
        this.members = {
            data: {
                owner: _creator.toLowerCase(),
                members: [_creator.toLowerCase()],
                signator: {
                    username: _creator.toLowerCase(),
                    publicKey: _publicKey
                }
            }
        }
    }
}

class User {
    constructor(_username, _publicKey, _login, _infoSignature, _dataSignature, _pfpSignature, _followingSignature) {
        this.info = {
            data: {
                username: _username.toLowerCase(), 
                publicKey: _publicKey, 
                login: _login
            },
            signature: _infoSignature
        }
        this.data = {
            data: {
                username: _username.toLowerCase(),
                name: '',
                bio: '',
                publicKey: _publicKey
            },
            signature: _dataSignature
        }
        this.pfp = {
            data: {
                pfp: '',
                publicKey: _publicKey
            },
            signature: _pfpSignature
        }
        this.following = {
            data: {
                following: [_username.toLowerCase()],
                publicKey: _publicKey
            },
            signature: _followingSignature
        }
    }
}

/*class NewUser {
    constructor(_username, _password) {
        let keyArr = []
        if (typeof window === 'object') {
          if (typeof window.crypto === 'object') {
            let keyPair = await window.crypto.subtle.generateKey(
              {
                  name: "RSA-PSS",
                  modulusLength: 4096, //can be 1024, 2048, or 4096
                  publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
                  hash: {name: "SHA-256"}, //can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
              },
              true, //whether the key is extractable (i.e. can be used in exportKey)
              ["sign", "verify"] //can be any combination of "sign" and "verify"
          )
          let jwk = await window.crypto.subtle.exportKey('jwk', keyPair.privateKey)
          console.log(jwk)
          let privateKey = rs.KEYUTIL.getKey(jwk)
          keyArr.push(privateKey)
          }
        } else {
            console.log('window.crypto not available.  Key generation may take a while...')
            let keyPair = rs.KEYUTIL.generateKeypair("RSA", 4096)
            keyArr.push(keyPair.prvKeyObj)
        }
        this.info = {
            data: {
                username: _username.toLowerCase(), 
                publicKey: _publicKey, 
                login: _login
            },
            signature: _infoSignature
        }
        this.data = {
            data: {
                username: _username.toLowerCase(),
                name: '',
                bio: '',
                publicKey: _publicKey
            },
            signature: _dataSignature
        }
        this.pfp = {
            data: {
                pfp: '',
                publicKey: _publicKey
            },
            signature: _pfpSignature
        }
        this.following = {
            data: {
                following: [_username.toLowerCase()],
                publicKey: _publicKey
            },
            signature: _followingSignature
        }
    }
}*/


export {Chat, Post, Group, User}