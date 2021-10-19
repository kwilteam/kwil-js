import getKeyIDFromPrivateJWK from './internal/getKeyIDFromPrivateJWK.js'
import sign from './internal/sign.js'
import sha384 from './internal/sha384.js'
import generateSalt from './internal/generateSalt.js'
import aes256 from 'aes256'
import rs from 'jsrsasign'
import hashPath from './internal/hashPath.js'
import gateway from './gateway.js'

class User {
    constructor(_username, _modulus, _email, _salt, _loginCipherText, _name, _bio, _pfpHash, _rsaSignature) {
        this.username = _username.toLowerCase()
        this.modulus = _modulus
        this.email = _email
        this.salt = _salt
        this.login = _loginCipherText
        this.name = _namethis.bio = _bio
        this.pfpHash = _pfpHash
        this.pfpURL = gateway+'/images'+hashPath(_pfpHash)+_pfpHash
        this.signature = _rsaSignature
    }
}

class NewUser {
    constructor(_usernameReg, _password, _privateJWK, _email='') {
        const _username = _usernameReg.toLowerCase();
        const modulus = _privateJWK.n;
        const passSalt = generateSalt()
        const encryptKey = _username.toLowerCase() + _password + passSalt;
        const ciphertext = aes256.encrypt(encryptKey, JSON.stringify(_privateJWK)); //This generates the AES-256 cipher based on Username, Password, and the Private JWK
        let emailHash = ''
        if (_email !== '') {
            emailHash = sha384(_email) //These values are all declared up here because they are used twice
        }
        const hashedPFP = ''     //This isn't necessary for any value besides the salt and ciphertext, as they are non-deterministic
        this.username = _username
        this.modulus = modulus
        this.email = emailHash
        this.salt = passSalt
        this.login = ciphertext
        this.name = ''
        this.bio = ''
        this.pfpHash = hashedPFP
        this.signature = sign(JSON.stringify({
            username: _username,
            name: '',
            bio: '',
            pfpHash: hashedPFP
        }), rs.KEYUTIL.getKey(_privateJWK))
        this.creationSignature = sign(JSON.stringify({
            username: _usernameReg.toLowerCase(),
            modulus: modulus,
            email: emailHash,
            salt: passSalt,
            login: ciphertext
        }), rs.KEYUTIL.getKey(_privateJWK))
        this.pfpURL = '' //It is important that the pfp url is not included in the RSA signature
    }
}

class Group {
    constructor(_groupName, _owner, _public, _groupDesc, _tags, _links, _moderators, _imageHash, _imageUrl, _color, _rsaSignature) {
        this.groupName = _groupName
        this.owner = _owner.toLowerCase()
        this.public = _public
        this.description = _groupDesc
        this.tags = _tags
        this.links = _links
        this.moderators = _moderators
        this.imageHash = _imageHash
        this.imageUrl = _imageUrl
        this.color = _color
        this.signature = _rsaSignature
    }
}

class Thought {
    constructor(_postID, _postText, _postTime, _username, _group, _photoHash, _photoURL, _rsaSignature) {
        this.ID = _postID
        this.postText = _postText
        this.timeStamp = _postTime
        this.type = 'Thought'
        this.username = _username.toLowerCase()
        this.group = _group
        this.photoHash = _photoHash
        this.photoURL = _photoURL
        this.signature = _rsaSignature
    }
}

class Thinkpiece {
    constructor(_postID, _postTitle, _postText, _postTime, _username, _group, _photoHash, _photoURL, _rsaSignature) {
        this.ID = _postID
        this.postText = _postText
        this.postTitle = _postTitle
        this.timeStamp = _postTime
        this.type = 'Thinkpiece'
        this.username = _username.toLowerCase()
        this.group = _group
        this.photoHash = _photoHash
        this.photoURL = _photoURL
        this.signature = _rsaSignature
    }
}

class Comment {
    constructor(_postID, _postText, _postTime, _username, _referencing, _rsaSignature) {
        this.ID = _postID
        this.postText = _postText
        this.timeStamp = _postTime
        this.type = 'Comment'
        this.username = _username
        this.referencing = _referencing
        this.signature = _rsaSignature
    }
}

class Event {
    constructor(_eventID, _eventName, _eventDesc, _eventTime, _country, _city, _tags, _group, _creator, _rsaSignature) {
        this.ID = _eventID
        this.eventName = _eventName
        this.description = _eventDesc
        this.time = _eventTime
        this.country = _country
        this.city = _city
        this.tags = _tags
        this.group = _group
        this.creator = _creator
        this.signature = _rsaSignature
    }
}

class UserFollowReceipt {
    constructor(_follower, _followee, _signature) {
        this.follower = _follower.toLowerCase()
        this.followee = _followee.toLowerCase()
        this.signature = _signature
    }
}

class GroupFollowReceipt {
    constructor(_follower, _group, _signature) {
        this.follower = _follower.toLowerCase()
        this.group = _group
        this.signature = _signature
    }
}

class LikeReceipt {
    constructor(_username, _postID, _signature) {
        this.username = _username.toLowerCase()
    }
}

class Message {
    constructor(_chatID, _body, _timestamp, _signature) {
        this.chatID = _chatID
        this.body = _body
        this.timestamp = _timestamp
        this.signature = _signature
    }
}

class MessageBody {
    constructor(_username, _publicKey, _message, _valid, _timeStamp) {
        this.username = _username.toLowerCase()
        this.publicKey = _publicKey
        this.message = _message
        this.signedTimestamp = _timeStamp
        this.valid = _valid
    }
}

class NewMessage {
    constructor(_usernameReg, _msgText, _chatID, _chatKey, _privateJWK) {
        const _username = _usernameReg.toLowerCase()
        const _privateKey = rs.KEYUTIL.getKey(_privateJWK)
        const _keyID = getKeyIDFromPrivateJWK(_privateJWK)
        const _time = Date.now()
        const _body = new MessageBody(_username, _keyID, _msgText, true, _time)
        this.chatID = _chatID
        this.body = aes256.encrypt(_chatKey, JSON.stringify(_body))
        this.timestamp = _time
        this.signature = sign(_body, _privateKey)
    }
}

class TempMessage {
    constructor(_sender, _receiver, _msgText, _timeStamp) {
        this.sender = _sender
        this.receiver = _receiver
        this.msg = _msgText
        this.timestamp = _timeStamp
    }
}

class NewThought {
    constructor(_text, _img, _privateJWK, _username, _groupTag = null) {
        const timestamp = new Date()
        const imgHash = [sha384(_img)]
        const _ID = sha384(_username+_text+imgHash+timestamp.toString())
        this.data = {
            id: _ID,
            username: _username.toLowerCase(),
            title: null,
            text: _text,
            type: true,
            timestamp: timestamp,
            photoHash: imgHash,
            group: _groupTag
        }
        this.photoURL = ''
        this.photo = [_img]
        this.signature = sign(
            {
                id: _ID,
                username: _username.toLowerCase(),
                title: null,
                text: _text,
                type: true,
                timestamp: timestamp,
                photoHash: imgHash,
                group: _groupTag
            },
            rs.KEYUTIL.getKey(_privateJWK)
        )
    }
}

class NewThinkpiece {
    constructor(_title, _text, _img, _privateJWK, _username, _groupTag = null) {
        const timestamp = new Date()
        let hashArr = []
        for (let i=0; i<_img.length; i++) {
            hashArr.push(sha384(_img[i]))
        }
        const _ID = sha384(_username+_text+JSON.stringify(hashArr)+timestamp.toString())
        this.data = {
            id: _ID,
            username: _username.toLowerCase(),
            title: _title,
            text: _text,
            type: false,
            timestamp: timestamp,
            photoHash: hashArr,
            group: _groupTag
        }
        this.photoURL = []
        this.photo = _img
        this.signature = sign(
            {
                id: _ID,
                username: _username.toLowerCase(),
                title: _title,
                text: _text,
                type: false,
                timestamp: timestamp,
                photoHash: hashArr,
                group: _groupTag
            },
            rs.KEYUTIL.getKey(_privateJWK)
        )
    }
}

class NewComment {
    constructor(_text, _username, _referenceID, _referenceType, _privateJWK) {
        const timestamp = new Date()
        const _ID = sha384(_username+_text+timestamp.toString())
        this.data = {
            id: _ID,
            text: _text,
            timestamp: timestamp,
            username: _username.toLowerCase(),
            referenceID: _referenceID
        }
        this.referenceType = _referenceType
        this.signature = sign({
            id: _ID,
            text: _text,
            timestamp: timestamp,
            username: _username.toLowerCase(),
            referenceID: _referenceID
        },
        rs.KEYUTIL.getKey(_privateJWK))
    }
}

class NewGroup {
    constructor(
        _groupName,
        _public,
        _groupDescription,
        _groupTags,
        _groupImage,
        _links,
        _color,
        _creatorUsernameReg,
        _creatorPrivateJWK
        ) {
            let imgHash = ''
            if (_groupImage != '') {
                imgHash = sha384(_groupImage)
            }
            this.data = {
                groupName: _groupName.toUpperCase(),
                public: _public,
                description: _groupDescription,
                tags: _groupTags,
                photoHash: imgHash,
                links: _links,
                color: _color,
                username: _creatorUsernameReg.toLowerCase(),
                moderators: [],

            }
            this.photoURL = ''
            this.photo = _groupImage
            this.signature = sign({
                groupName: _groupName.toUpperCase(),
                public: _public,
                description: _groupDescription,
                tags: _groupTags,
                photoHash: imgHash,
                links: _links,
                color: _color,
                username: _creatorUsernameReg.toLowerCase()
            },
            rs.KEYUTIL.getKey(_creatorPrivateJWK)
            )
        }
}

export {Message, NewMessage, MessageBody, TempMessage, NewUser, NewThought, NewThinkpiece, NewComment, NewGroup, User}