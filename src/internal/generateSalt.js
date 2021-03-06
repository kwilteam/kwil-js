const generateSalt = () => {
    const validChars =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890,.<>/?;:[]{}|+=_-)(*&^%$#@!~';
    let salt = '';
    for (let i = 0; i < 16; i++) {
        const randomElement = Math.floor(Math.random() * validChars.length);
        salt = salt + validChars[randomElement];
    }
    return salt;
};

export default generateSalt;
