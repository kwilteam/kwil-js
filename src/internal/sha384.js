import jssha from 'jssha';

const base64toBase64URL = (_hash) => {
    let newStr = '';
    for (let i = 0; i < _hash.length; i++) {
        if (_hash[i] == '+') {
            newStr = newStr + '-';
        } else if (_hash[i] == '/') {
            newStr = newStr + '_';
        } else {
            newStr = newStr + _hash[i];
        }
    }
    return newStr;
};

const sha384 = (_text) => {
    try {
    const shaObj = new jssha('SHA-384', 'TEXT', { encoding: 'UTF8' });
    shaObj.update(_text);
    const b64Hash = shaObj.getHash('B64');
    return base64toBase64URL(b64Hash);
    } catch(e) {
        console.log(e)
        throw new Error('Tried to hash something that is not a string. Make sure all inputs are correctly formatted.')
    }
};

export default sha384;
