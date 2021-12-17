import getKeyIDFromPrivateJWK from './internal/getKeyIDFromPrivateJWK.js';
import sign from './internal/sign.js';
import sha384 from './internal/sha384.js';
import generateSalt from './internal/generateSalt.js';
import aes256 from 'react-native-crypto-js';
import rs from 'jsrsasign';

class NewUser {
    constructor(_username, _ciphertext, _privateJWK, _salt, _settingsCipherText, _email = '') {
        _username = _username.toLowerCase()
        const modulus = _privateJWK.n;
        const passSalt = _salt;
        const currentDate = new Date
        let emailHash = '';
        if (_email !== '') {
            emailHash = sha384(_email); //These values are all declared up here because they are used twice
        }
        const hashedPFP = ''; //This isn't necessary for any value besides the salt and ciphertext, as they are non-deterministic
        this.username = _username;
        this.modulus = modulus;
        this.email = emailHash;
        this.salt = passSalt;
        this.login = _ciphertext;
        this.name = '';
        this.bio = '';
        this.photoHash = hashedPFP;
        this.bannerHash = ''
        this.settings = _settingsCipherText
        this.settingsTime = currentDate
        this.signature = sign(
            JSON.stringify({
                username: _username,
                name: '',
                bio: '',
                photoHash: hashedPFP,
                bannerHash: ''
            }),
            rs.KEYUTIL.getKey(_privateJWK)
        );
        this.settingsSignature = sign(
            JSON.stringify({
                settings: _settingsCipherText,
                date: currentDate
            }), rs.KEYUTIL.getKey(_privateJWK)
        )
        this.creationSignature = sign(
            JSON.stringify({
                username: _username,
                modulus: modulus,
                email: emailHash,
                salt: passSalt,
                login: _ciphertext,
            }),
            rs.KEYUTIL.getKey(_privateJWK)
        );
    }
}

class Message {
    constructor(_chatID, _body, _timestamp, _signature) {
        this.chatID = _chatID;
        this.body = _body;
        this.timestamp = _timestamp;
        this.signature = _signature;
    }
}

class MessageBody {
    constructor(_username, _publicKey, _message, _valid, _timeStamp) {
        this.username = _username.toLowerCase();
        this.publicKey = _publicKey;
        this.message = _message;
        this.signedTimestamp = _timeStamp;
        this.valid = _valid;
    }
}

class NewMessage {
    constructor(_usernameReg, _msgText, _chatID, _chatKey, _privateJWK) {
        const _username = _usernameReg.toLowerCase();
        const _privateKey = rs.KEYUTIL.getKey(_privateJWK);
        const _keyID = getKeyIDFromPrivateJWK(_privateJWK);
        const _time = Date.now();
        const _body = new MessageBody(_username, _keyID, _msgText, true, _time);
        this.chatID = _chatID;
        this.body = aes256.AES.encrypt(JSON.stringify(_body), _chatKey);
        this.timestamp = _time;
        this.signature = sign(_body, _privateKey);
    }
}

class TempMessage {
    constructor(_sender, _receiver, _msgText, _timeStamp) {
        this.sender = _sender;
        this.receiver = _receiver;
        this.msg = _msgText;
        this.timestamp = _timeStamp;
    }
}

class NewThought {
    constructor(_text, _img, _privateJWK, _username, _groupTag = null) {
        const timestamp = new Date();
        let imgHash;
        if (_img != '' && _img != []) {
            imgHash = [sha384(_img)];
        }
        const _ID = sha384(_username + _text + imgHash + timestamp.toString());
        this.data = {
            id: _ID,
            username: _username.toLowerCase(),
            title: null,
            text: _text,
            type: true,
            timestamp: timestamp,
            photoHash: imgHash,
            group: _groupTag,
        };
        if (_img == '') {
            this.photo = [];
        } else {
            this.photo = [_img];
        }
        this.signature = sign(
            JSON.stringify({
                id: _ID,
                username: _username.toLowerCase(),
                title: null,
                text: _text,
                type: true,
                timestamp: timestamp,
                photoHash: imgHash,
                group: _groupTag,
            }),
            rs.KEYUTIL.getKey(_privateJWK)
        );
    }
}

class NewThinkpiece {
    constructor(_title, _text, _img, _privateJWK, _username, _groupTag = null) {
        const timestamp = new Date();
        let hashArr = [];
        if (_img != []) {
            for (let i = 0; i < _img.length; i++) {
                hashArr.push(sha384(_img[i]));
            }
        }
        const _ID = sha384(_username + _text + JSON.stringify(hashArr) + timestamp.toString());
        this.data = {
            id: _ID,
            username: _username.toLowerCase(),
            title: _title,
            text: _text,
            type: false,
            timestamp: timestamp,
            photoHash: hashArr,
            group: _groupTag,
        };
        this.photo = _img;
        this.signature = sign(
            JSON.stringify({
                id: _ID,
                username: _username.toLowerCase(),
                title: _title,
                text: _text,
                type: false,
                timestamp: timestamp,
                photoHash: hashArr,
                group: _groupTag,
            }),
            rs.KEYUTIL.getKey(_privateJWK)
        );
    }
}

class NewComment {
    constructor(_text, _username, _referenceID, _referenceType, _privateJWK) {
        const timestamp = new Date();
        const _ID = sha384(_username + _text + timestamp.toString());
        this.data = {
            id: _ID,
            text: _text,
            timestamp: timestamp,
            username: _username.toLowerCase(),
            referenceID: _referenceID,
        };
        this.referenceType = _referenceType;
        this.signature = sign(JSON.stringify(
            {
                id: _ID,
                text: _text,
                timestamp: timestamp,
                username: _username.toLowerCase(),
                referenceID: _referenceID,
            }),
            rs.KEYUTIL.getKey(_privateJWK)
        );
    }
}

class NewGroup {
    constructor(
        _groupName,
        _public,
        _groupDescription,
        _groupTags,
        _rules,
        _groupImage,
        _groupBanner,
        _links,
        _color,
        _username,
        _creatorPrivateJWK
    ) {
        _username = _username.toLowerCase();
        _groupName = _groupName.toUpperCase();
        let imgHash = '';
        let bannerHash = '';
        if (_groupImage != '') {
            imgHash = sha384(_groupImage);
        }
        if (_groupBanner != '') {
            bannerHash = sha384(_groupBanner);
        }
        this.data = {
            groupName: _groupName,
            public: _public,
            description: _groupDescription,
            tags: _groupTags,
            photoHash: imgHash,
            bannerHash: bannerHash,
            links: _links,
            rules: _rules,
            color: _color,
            timestamp: new Date,
            username: _username,
            moderators: [_username],
        };
        this.photo = [_groupImage];
        this.banner = [_groupBanner];
        this.signature = sign(
            JSON.stringify(this.data),
            rs.KEYUTIL.getKey(_creatorPrivateJWK)
        );
    }
}

export {
    Message,
    NewMessage,
    MessageBody,
    TempMessage,
    NewUser,
    NewThought,
    NewThinkpiece,
    NewComment,
    NewGroup
};
