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
    const shaObj = new jssha('SHA-384', 'TEXT', { encoding: 'UTF8' });
    shaObj.update(_text);
    const b64Hash = shaObj.getHash('B64');
    return base64toBase64URL(b64Hash);
};

export default sha384;
