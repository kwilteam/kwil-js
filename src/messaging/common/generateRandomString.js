const generateRandomString = (_length) => {
const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-=+';

    let result = ' ';
    const charactersLength = characters.length;
    for ( let i = 0; i < _length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;

}

export default generateRandomString