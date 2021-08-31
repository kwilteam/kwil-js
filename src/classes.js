import {sha256} from 'js-sha256'
import rs from 'jsrsasign'
import sign from './internal/sign.js'
import getPublicJWKFromPrivateJWK from './internal/getPublicJWKFromPrivateJWK.js'
import aes256 from 'aes256'
import privateKey from './devKey.js'

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

class NewUser {
    constructor(_usernameReg, _password, _privateJWK) {
        const _username = _usernameReg.toLowerCase()
        const publicKey = getPublicJWKFromPrivateJWK(_privateJWK)
        const encryptKey = _username.toLowerCase() + _password
        const cipher = aes256.encrypt(encryptKey, JSON.stringify(_privateJWK)) //This generates the AES-256 cipher based on Username, Password, and the Private JWK
        this.info = {
            data: {
                username: _username, 
                publicKey: publicKey, 
                login: cipher
            },
            signature: sign({
                username: _username, 
                publicKey: publicKey, 
                login: cipher
            }, _privateJWK)
        }
        this.data = {
            data: {
                username: _username,
                name: '',
                bio: '',
                publicKey: publicKey
            },
            signature: sign({
                username: _username,
                name: '',
                bio: '',
                publicKey: publicKey
            }, _privateJWK)
        }
        this.pfp = {
            data: {
                pfp: '',
                publicKey: publicKey
            },
            signature: sign({
                pfp: '',
                publicKey: publicKey
            }, _privateJWK)
        }
        this.following = {
            data: {
                following: [_username, 'ecclesia'],
                groups: [],
                publicKey: publicKey
            },
            signature: sign({
                following: [_username],
                publicKey: publicKey
            }, _privateJWK)
        }
    }
}


export {Chat, Post, Group, User, NewUser}
/*let test1 = new NewUser('brennan', 'Ecclesia1', privateKey)
console.log(JSON.stringify(test1))
*/